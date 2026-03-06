"""AI service layer with real API calls."""

import json
import os
from typing import AsyncGenerator, Dict, List, Optional
from uuid import UUID

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from tenacity import retry, stop_after_attempt, wait_exponential

from app.models.api_config import APIConfig
from app.schemas.conversation import ChatRequest, ChatResponse, Message


class AIService:
    """AI business logic service with real API integration."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.http_client = httpx.AsyncClient(timeout=60.0, trust_env=False)

    async def get_default_config(self) -> Optional[APIConfig]:
        """Get the default API configuration."""
        result = await self.db.execute(
            select(APIConfig).where(APIConfig.is_default == True)
        )
        config = result.scalar_one_or_none()
        if config:
            return config

        # Fallback to first active config
        result = await self.db.execute(
            select(APIConfig).where(APIConfig.is_active == True).limit(1)
        )
        return result.scalar_one_or_none()

    def _get_api_headers(self, config: APIConfig) -> Dict:
        """Get headers for API request."""
        headers = {
            "Content-Type": "application/json",
        }

        # type: ignore
        api_key_encrypted = str(config.api_key_encrypted) if config.api_key_encrypted else ""
        # Decrypt the API key (base64 decode)
        import base64
        try:
            api_key = base64.b64decode(api_key_encrypted.encode()).decode()
        except Exception:
            api_key = api_key_encrypted  # Fallback to encrypted value if decode fails
        headers["Authorization"] = f"Bearer {api_key}"

        return headers

    def _get_api_url(self, config: APIConfig, endpoint: str = "/chat/completions") -> str:
        """Get full API URL."""
        # type: ignore
        base_url = str(config.base_url) if config.base_url else "https://integrate.api.nvidia.com/v1"
        if not base_url.endswith("/v1"):
            base_url = f"{base_url}/v1"
        return f"{base_url}{endpoint}"

    def _get_config_value(self, config: APIConfig, attr: str) -> str:
        """Safely get config attribute value."""
        val = getattr(config, attr, None)
        return str(val) if val else ""

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def _call_llm_api(
        self,
        config: APIConfig,
        messages: List[Dict],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False,
    ):
        """Make actual LLM API call."""
        url = self._get_api_url(config)
        headers = self._get_api_headers(config)

        model = self._get_config_value(config, "model") or "nvidia/moonshotai/kimi-k2.5"

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
        }

        response = await self.http_client.post(
            url,
            headers=headers,
            json=payload,
        )
        response.raise_for_status()

        if stream is True:
            return response

        return response.json()  # type: ignore

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        """Generate text using AI."""
        config = await self.get_default_config()
        if not config:
            raise ValueError("No API configuration available")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            response = await self._call_llm_api(
                config,
                messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )

            # type: ignore
            if isinstance(response, dict) and "choices" in response and len(response["choices"]) > 0:
                content = response["choices"][0].get("message", {}).get("content", "")
                return content.strip()
            return "No response generated"

        except Exception as e:
            # Fallback to placeholder on error
            return f"AI Service temporarily unavailable. Error: {str(e)[:100]}"

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """Generate text with streaming."""
        config = await self.get_default_config()
        if not config:
            yield "Error: No API configuration available"
            return

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            response = await self._call_llm_api(
                config,
                messages,
                stream=True,
            )

            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        content = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                        if content:
                            yield content
                    except json.JSONDecodeError:
                        continue

        except Exception as e:
            yield f"Error: {str(e)[:100]}"

    async def analyze_idea(self, idea_description: str) -> Dict:
        """Analyze user's idea and return structured analysis."""
        system_prompt = """You are an expert product manager and business analyst.
        Analyze the user's idea and provide a structured JSON analysis with the following fields:
        - problem_statement: Clear problem being solved
        - target_audience: Who benefits from this
        - key_features: List of 3-5 key features
        - challenges: List of 2-3 potential challenges
        - success_metrics: List of 2-3 metrics to measure success
        - suggestions: List of 3-5 implementation suggestions

        Return ONLY valid JSON, no markdown formatting."""

        prompt = f"Analyze this idea: {idea_description}"

        try:
            response_text = await self.generate_text(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.3,
                max_tokens=1500,
            )

            # Try to extract JSON from response
            json_str = response_text.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            if json_str.startswith("```"):
                json_str = json_str[3:]
            if json_str.endswith("```"):
                json_str = json_str[:-3]
            json_str = json_str.strip()

            return json.loads(json_str)

        except Exception as e:
            # Return fallback structure on error
            return {
                "problem_statement": f"Analyzing: {idea_description[:50]}...",
                "target_audience": "Users who need this solution",
                "key_features": ["Core functionality", "User interface", "Data management"],
                "challenges": ["Technical implementation", "User adoption"],
                "success_metrics": ["User engagement", "Task completion rate"],
                "suggestions": [
                    "Define clear user personas",
                    "Create a prototype for testing",
                    "Consider scalability from day one",
                ],
            }

    async def expand_node(
        self,
        node_title: str,
        node_description: str,
        context: Optional[str] = None,
    ) -> Dict:
        """Expand a tree node with AI suggestions."""
        system_prompt = """You are a project planning expert. Break down tasks and provide structured suggestions.
        Return ONLY valid JSON with these fields:
        - sub_tasks: List of objects with 'title' and 'description'
        - questions: List of clarifying questions
        - approaches: List of implementation approaches
        - risks: List of potential risks"""

        prompt = f"""Project Node:
        Title: {node_title}
        Description: {node_description}

        Context: {context or "Part of a larger project"}

        Please provide a detailed breakdown."""

        try:
            response_text = await self.generate_text(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.4,
                max_tokens=1500,
            )

            json_str = response_text.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            if json_str.startswith("```"):
                json_str = json_str[3:]
            if json_str.endswith("```"):
                json_str = json_str[:-3]
            json_str = json_str.strip()

            return json.loads(json_str)

        except Exception:
            return {
                "sub_tasks": [
                    {"title": f"Research {node_title}", "description": "Gather requirements and information"},
                    {"title": f"Design {node_title}", "description": "Create detailed design specifications"},
                    {"title": f"Implement {node_title}", "description": "Build the actual functionality"},
                ],
                "questions": [
                    "What are the specific requirements?",
                    "What are the success criteria?",
                    "Are there any dependencies?",
                ],
                "approaches": [
                    "Iterative development with feedback loops",
                    "MVP approach with incremental improvements",
                ],
                "risks": [
                    "Scope creep",
                    "Technical complexity",
                    "Time constraints",
                ],
            }

    async def suggest_improvements(self, project_data: Dict) -> List[str]:
        """Suggest improvements for a project."""
        system_prompt = """You are a senior consultant. Provide 3-5 actionable improvement suggestions.
        Return as a simple numbered list, one suggestion per line."""

        prompt = f"Review this project and suggest improvements:\n{json.dumps(project_data, indent=2)}"

        try:
            response_text = await self.generate_text(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.5,
                max_tokens=800,
            )

            suggestions = []
            for line in response_text.split("\n"):
                line = line.strip()
                if line and (line[0].isdigit() or line.startswith("- ")):
                    suggestion = line.lstrip("0123456789.- ")
                    if suggestion:
                        suggestions.append(suggestion)

            return suggestions if suggestions else [
                "Consider adding user authentication",
                "Implement data validation",
                "Add error handling",
            ]

        except Exception:
            return [
                "Consider adding user authentication",
                "Implement data validation",
                "Add error handling",
            ]

    async def chat(
        self,
        request: ChatRequest,
        conversation_history: List[Dict],
    ) -> ChatResponse:
        """Process chat message and return response."""
        config = await self.get_default_config()
        if not config:
            raise ValueError("No API configuration available")

        # Build message history
        messages = []
        if conversation_history:
            for msg in conversation_history:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", ""),
                })

        messages.append({"role": "user", "content": request.message})

        try:
            response = await self._call_llm_api(
                config,
                messages,
                temperature=0.7,
                max_tokens=2000,
            )

            content = "No response"
            tokens_used = 0
            model_used = str(config.model) if config.model else "unknown"

            # type: ignore
            if isinstance(response, dict) and "choices" in response and len(response["choices"]) > 0:
                content = response["choices"][0].get("message", {}).get("content", "No response")
                tokens_used = response.get("usage", {}).get("total_tokens", len(content) // 4)
                model_used = response.get("model", str(config.model) if config.model else "unknown")

            return ChatResponse(
                message=Message(role="assistant", content=content.strip()),
                session_id=request.session_id or "new_session",
                tokens_used=tokens_used,
                model=str(model_used),
            )

        except Exception as e:
            return ChatResponse(
                message=Message(role="assistant", content=f"I'm having trouble connecting to the AI service. Error: {str(e)[:100]}"),
                session_id=request.session_id or "new_session",
                tokens_used=0,
                model=str(config.model) if config.model else "error",
            )

    async def chat_stream(
        self,
        request: ChatRequest,
        conversation_history: List[Dict],
    ) -> AsyncGenerator[str, None]:
        """Process chat message with streaming response."""
        config = await self.get_default_config()
        if not config:
            yield json.dumps({
                "type": "error",
                "content": "No API configuration available",
            })
            return

        messages = []
        if conversation_history:
            for msg in conversation_history:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", ""),
                })

        messages.append({"role": "user", "content": request.message})

        try:
            response = await self._call_llm_api(
                config,
                messages,
                stream=True,
            )

            buffer = ""
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        content = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                        if content:
                            buffer += content
                            yield json.dumps({
                                "type": "chunk",
                                "content": content,
                            })
                    except json.JSONDecodeError:
                        continue

            yield json.dumps({
                "type": "done",
                "full_content": buffer,
            })

        except Exception as e:
            yield json.dumps({
                "type": "error",
                "content": f"Streaming error: {str(e)[:100]}",
            })

    async def close(self):
        """Close HTTP client."""
        await self.http_client.aclose()


def get_ai_service(db: AsyncSession) -> AIService:
    """Factory function for AI service."""
    return AIService(db)

/**
 * Project templates for different industries
 */

export interface TemplateNode {
  id: string;
  label: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  children?: TemplateNode[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  domain: string;
  icon: string;
  color: string;
  nodes: TemplateNode[];
}

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'software-development',
    name: '软件开发项目',
    description: '适用于App、网站、系统开发等软件项目',
    domain: '软件开发',
    icon: 'code',
    color: 'blue',
    nodes: [
      {
        id: 'root',
        label: '软件开发项目',
        description: '完整的软件开发项目规划',
        status: 'todo',
        children: [
          {
            id: 'requirements',
            label: '需求分析',
            description: '收集和分析用户需求',
            status: 'todo',
            children: [
              { id: 'req-1', label: '用户调研', description: '了解目标用户群体', status: 'todo' },
              { id: 'req-2', label: '竞品分析', description: '分析市场上的竞争产品', status: 'todo' },
              { id: 'req-3', label: '功能需求', description: '定义核心功能列表', status: 'todo' },
              { id: 'req-4', label: '非功能需求', description: '性能、安全、可用性要求', status: 'todo' },
            ],
          },
          {
            id: 'design',
            label: '设计阶段',
            description: '产品和技术设计',
            status: 'todo',
            children: [
              { id: 'design-1', label: 'UI/UX设计', description: '界面和交互设计', status: 'todo' },
              { id: 'design-2', label: '技术架构', description: '系统架构设计', status: 'todo' },
              { id: 'design-3', label: '数据库设计', description: '数据模型设计', status: 'todo' },
              { id: 'design-4', label: 'API设计', description: '接口规范设计', status: 'todo' },
            ],
          },
          {
            id: 'development',
            label: '开发阶段',
            description: '编码实现',
            status: 'todo',
            children: [
              { id: 'dev-1', label: '环境搭建', description: '开发环境配置', status: 'todo' },
              { id: 'dev-2', label: '核心功能开发', description: '实现主要功能', status: 'todo' },
              { id: 'dev-3', label: '测试', description: '单元测试和集成测试', status: 'todo' },
              { id: 'dev-4', label: 'Bug修复', description: '问题修复和优化', status: 'todo' },
            ],
          },
          {
            id: 'deployment',
            label: '部署上线',
            description: '发布和运维',
            status: 'todo',
            children: [
              { id: 'deploy-1', label: '部署环境', description: '服务器和环境配置', status: 'todo' },
              { id: 'deploy-2', label: '上线发布', description: '正式发布', status: 'todo' },
              { id: 'deploy-3', label: '监控告警', description: '系统监控配置', status: 'todo' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'cosmetics-brand',
    name: '化妆品品牌',
    description: '适用于化妆品、护肤品品牌创业',
    domain: '化妆品',
    icon: 'sparkles',
    color: 'pink',
    nodes: [
      {
        id: 'root',
        label: '化妆品品牌项目',
        description: '打造自有化妆品品牌',
        status: 'todo',
        children: [
          {
            id: 'market',
            label: '市场调研',
            description: '了解市场和竞争格局',
            status: 'todo',
            children: [
              { id: 'market-1', label: '目标客群', description: '定义目标消费群体', status: 'todo' },
              { id: 'market-2', label: '竞品分析', description: '分析主要竞争品牌', status: 'todo' },
              { id: 'market-3', label: '价格定位', description: '确定产品价格区间', status: 'todo' },
            ],
          },
          {
            id: 'product',
            label: '产品开发',
            description: '产品研发和生产',
            status: 'todo',
            children: [
              { id: 'product-1', label: '配方研发', description: '产品配方开发', status: 'todo' },
              { id: 'product-2', label: '包装设计', description: '产品包装和视觉设计', status: 'todo' },
              { id: 'product-3', label: '供应链', description: '原料和生产商选择', status: 'todo' },
              { id: 'product-4', label: '质量检测', description: '产品质量和安全检测', status: 'todo' },
            ],
          },
          {
            id: 'brand',
            label: '品牌建设',
            description: '品牌形象和传播',
            status: 'todo',
            children: [
              { id: 'brand-1', label: '品牌定位', description: '品牌核心价值定位', status: 'todo' },
              { id: 'brand-2', label: 'VI设计', description: 'Logo和视觉识别系统', status: 'todo' },
              { id: 'brand-3', label: '品牌故事', description: '品牌叙事和内容', status: 'todo' },
            ],
          },
          {
            id: 'sales',
            label: '销售渠道',
            description: '建立销售网络',
            status: 'todo',
            children: [
              { id: 'sales-1', label: '电商平台', description: '天猫、京东、抖音等', status: 'todo' },
              { id: 'sales-2', label: '线下渠道', description: '专柜、代理商', status: 'todo' },
              { id: 'sales-3', label: '私域运营', description: '微信社群、小程序', status: 'todo' },
            ],
          },
          {
            id: 'marketing',
            label: '营销推广',
            description: '品牌推广和获客',
            status: 'todo',
            children: [
              { id: 'marketing-1', label: 'KOL合作', description: '达人和博主合作', status: 'todo' },
              { id: 'marketing-2', label: '内容营销', description: '小红书、抖音内容', status: 'todo' },
              { id: 'marketing-3', label: '广告投放', description: '信息流广告', status: 'todo' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'website-app',
    name: '网站/Web应用',
    description: '适用于企业官网、电商网站、SaaS应用',
    domain: '网站',
    icon: 'globe',
    color: 'green',
    nodes: [
      {
        id: 'root',
        label: '网站项目',
        description: '网站或Web应用开发',
        status: 'todo',
        children: [
          {
            id: 'planning',
            label: '规划阶段',
            description: '项目规划和定义',
            status: 'todo',
            children: [
              { id: 'plan-1', label: '目标定义', description: '网站目标和KPI', status: 'todo' },
              { id: 'plan-2', label: '内容规划', description: '页面结构和内容', status: 'todo' },
              { id: 'plan-3', label: '技术选型', description: '框架和工具选择', status: 'todo' },
            ],
          },
          {
            id: 'design',
            label: '设计阶段',
            description: '视觉和交互设计',
            status: 'todo',
            children: [
              { id: 'design-1', label: '原型设计', description: '页面原型和流程', status: 'todo' },
              { id: 'design-2', label: '视觉设计', description: 'UI设计和切图', status: 'todo' },
              { id: 'design-3', label: '响应式设计', description: '多端适配', status: 'todo' },
            ],
          },
          {
            id: 'develop',
            label: '开发阶段',
            description: '前后端开发',
            status: 'todo',
            children: [
              { id: 'develop-1', label: '前端开发', description: '页面实现', status: 'todo' },
              { id: 'develop-2', label: '后端开发', description: 'API和数据库', status: 'todo' },
              { id: 'develop-3', label: 'CMS集成', description: '内容管理系统', status: 'todo' },
            ],
          },
          {
            id: 'launch',
            label: '上线运营',
            description: '发布和优化',
            status: 'todo',
            children: [
              { id: 'launch-1', label: '域名备案', description: '域名和服务器', status: 'todo' },
              { id: 'launch-2', label: 'SEO优化', description: '搜索引擎优化', status: 'todo' },
              { id: 'launch-3', label: '数据分析', description: '访问统计和分析', status: 'todo' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'content-creator',
    name: '内容创作/自媒体',
    description: '适用于自媒体、内容创作者、个人IP',
    domain: '内容创作',
    icon: 'video',
    color: 'purple',
    nodes: [
      {
        id: 'root',
        label: '自媒体项目',
        description: '打造个人IP和内容品牌',
        status: 'todo',
        children: [
          {
            id: 'positioning',
            label: '定位规划',
            description: '账号定位和规划',
            status: 'todo',
            children: [
              { id: 'pos-1', label: '领域选择', description: '确定内容领域', status: 'todo' },
              { id: 'pos-2', label: '人设打造', description: '个人形象定位', status: 'todo' },
              { id: 'pos-3', label: '差异化', description: '独特价值主张', status: 'todo' },
            ],
          },
          {
            id: 'content',
            label: '内容体系',
            description: '内容生产体系',
            status: 'todo',
            children: [
              { id: 'content-1', label: '选题库', description: '内容选题规划', status: 'todo' },
              { id: 'content-2', label: '内容模板', description: '标准化内容模板', status: 'todo' },
              { id: 'content-3', label: '发布节奏', description: '更新频率规划', status: 'todo' },
            ],
          },
          {
            id: 'platforms',
            label: '平台运营',
            description: '多平台布局',
            status: 'todo',
            children: [
              { id: 'plat-1', label: '抖音/快手', description: '短视频平台', status: 'todo' },
              { id: 'plat-2', label: '小红书', description: '图文种草平台', status: 'todo' },
              { id: 'plat-3', label: 'B站/YouTube', description: '中长视频平台', status: 'todo' },
              { id: 'plat-4', label: '公众号', description: '深度内容平台', status: 'todo' },
            ],
          },
          {
            id: 'monetize',
            label: '变现路径',
            description: '商业化变现',
            status: 'todo',
            children: [
              { id: 'money-1', label: '广告合作', description: '品牌广告植入', status: 'todo' },
              { id: 'money-2', label: '电商带货', description: '直播和橱窗', status: 'todo' },
              { id: 'money-3', label: '知识付费', description: '课程和咨询', status: 'todo' },
            ],
          },
        ],
      },
    ],
  },
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return projectTemplates.find((t) => t.id === id);
}

export function flattenTemplateNodes(nodes: TemplateNode[], parentId?: string): Array<{
  node: TemplateNode;
  parentId?: string;
}> {
  const result: Array<{ node: TemplateNode; parentId?: string }> = [];

  for (const node of nodes) {
    result.push({ node, parentId });
    if (node.children) {
      result.push(...flattenTemplateNodes(node.children, node.id));
    }
  }

  return result;
}

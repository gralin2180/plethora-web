/**
 * Extended OpenCode-style provider catalog (API-key compatible hosts).
 */

type ExtProvider = {
  id: string;
  name: string;
  tagline: string;
  group: "popular" | "other";
  recommended?: boolean;
  custom?: boolean;
  method: "api-key";
  methods: { id: "api-key"; title: string; sub: string }[];
  loginUrl: string;
  keyUrl?: string;
  baseUrl: string;
  defaultModel: string;
  placeholder: string;
  freeNote: string;
};

function apiOnly() {
  return [{ id: "api-key" as const, title: "API key", sub: "Browser" }];
}

function host(
  id: string,
  name: string,
  tagline: string,
  opts: {
    group?: "popular" | "other";
    baseUrl: string;
    defaultModel?: string;
    loginUrl?: string;
    keyUrl?: string;
    placeholder?: string;
    recommended?: boolean;
    custom?: boolean;
  }
): ExtProvider {
  return {
    id,
    name,
    tagline,
    group: opts.group ?? "other",
    recommended: opts.recommended,
    custom: opts.custom,
    method: "api-key",
    methods: apiOnly(),
    loginUrl: opts.loginUrl || opts.keyUrl || "#",
    keyUrl: opts.keyUrl,
    baseUrl: opts.baseUrl,
    defaultModel: opts.defaultModel || "default",
    placeholder: opts.placeholder || "API key",
    freeNote: `Sign in at ${name}, paste your API key. Stays on this device.`,
  };
}

export const EXTENDED_AI_PROVIDERS: ExtProvider[] = [
  {
    id: "opencode-go",
    name: "OpenCode Go",
    tagline: "Low cost subscription for everyone",
    group: "popular",
    recommended: true,
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://opencode.ai",
    keyUrl: "https://opencode.ai/auth",
    baseUrl: "https://opencode.ai/zen/v1",
    defaultModel: "laguna-s-2.1-free",
    placeholder: "Zen / Go key",
    freeNote: "OpenCode Go subscription — billed to your OpenCode account.",
  },
  host("amazon-bedrock", "Amazon Bedrock", "AWS foundation models", {
    baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com/openai/v1",
    loginUrl: "https://console.aws.amazon.com/bedrock",
    defaultModel: "anthropic.claude-3-haiku",
  }),
  host("deepinfra", "Deep Infra", "Hosted open models", {
    baseUrl: "https://api.deepinfra.com/v1/openai",
    loginUrl: "https://deepinfra.com",
    keyUrl: "https://deepinfra.com/dash/api_keys",
  }),
  host("databricks", "Databricks", "Model serving", {
    baseUrl: "https://YOUR-WORKSPACE.cloud.databricks.com/serving-endpoints/v1",
    loginUrl: "https://databricks.com",
  }),
  host("digitalocean", "DigitalOcean", "Gradient AI", {
    baseUrl: "https://inference.do-ai.run/v1",
    loginUrl: "https://cloud.digitalocean.com",
  }),
  host("zhipu", "Zhipu AI", "GLM models (China)", {
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    loginUrl: "https://open.bigmodel.cn",
    defaultModel: "glm-4-flash",
  }),
  host("zhipu-coding", "Zhipu AI Coding Plan", "Coding tier", {
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    loginUrl: "https://open.bigmodel.cn",
  }),
  host("alibaba-coding", "Alibaba Coding Plan", "Qwen coding", {
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    loginUrl: "https://dashscope.aliyun.com",
    defaultModel: "qwen-plus",
  }),
  host("alibaba-coding-cn", "Alibaba Coding Plan (China)", "China endpoint", {
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    loginUrl: "https://dashscope.aliyun.com",
  }),
  host("moonshot", "Moonshot / Kimi", "Long context", {
    baseUrl: "https://api.moonshot.cn/v1",
    loginUrl: "https://platform.moonshot.cn",
    defaultModel: "moonshot-v1-8k",
  }),
  host("minimax", "MiniMax", "China models", {
    baseUrl: "https://api.minimax.chat/v1",
    loginUrl: "https://platform.minimaxi.com",
  }),
  host("baichuan", "Baichuan", "China LLM", {
    baseUrl: "https://api.baichuan-ai.com/v1",
    loginUrl: "https://platform.baichuan-ai.com",
  }),
  host("stepfun", "StepFun", "Step models", {
    baseUrl: "https://api.stepfun.com/v1",
    loginUrl: "https://platform.stepfun.com",
  }),
  host("siliconflow", "SiliconFlow", "China model hub", {
    baseUrl: "https://api.siliconflow.cn/v1",
    loginUrl: "https://siliconflow.cn",
    recommended: true,
  }),
  host("openai-compatible", "302.AI", "China API gateway", {
    baseUrl: "https://api.302.ai/v1",
    loginUrl: "https://302.ai",
  }),
  host("zenmux", "ZenMux", "Model router", {
    baseUrl: "https://api.zenmux.ai/v1",
    loginUrl: "https://zenmux.ai",
  }),
  host("arcee", "Arcee", "Small models", {
    baseUrl: "https://api.arcee.ai/v1",
    loginUrl: "https://arcee.ai",
  }),
  host("cloudflare", "Cloudflare Workers AI", "Edge inference", {
    baseUrl: "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT/ai/v1",
    loginUrl: "https://dash.cloudflare.com",
  }),
  host("nvidia-nim", "NVIDIA NIM", "Nemotron / NIM", {
    baseUrl: "https://integrate.api.nvidia.com/v1",
    loginUrl: "https://build.nvidia.com",
    defaultModel: "nvidia/nemotron-4-340b-instruct",
  }),
  host("replicate", "Replicate", "Hosted models", {
    baseUrl: "https://openai-proxy.replicate.com/v1",
    loginUrl: "https://replicate.com",
  }),
  host("anyscale", "Anyscale", "Ray / open models", {
    baseUrl: "https://api.endpoints.anyscale.com/v1",
    loginUrl: "https://console.anyscale.com",
  }),
  host("lepton", "Lepton AI", "Fast inference", {
    baseUrl: "https://dashboard.lepton.ai/api/v1",
    loginUrl: "https://lepton.ai",
  }),
  host("hyperbolic", "Hyperbolic", "GPU inference", {
    baseUrl: "https://api.hyperbolic.xyz/v1",
    loginUrl: "https://hyperbolic.xyz",
  }),
  host("novita", "Novita AI", "Model API", {
    baseUrl: "https://api.novita.ai/v3/openai",
    loginUrl: "https://novita.ai",
  }),
  host("sambanova", "SambaNova", "Fast Llama", {
    baseUrl: "https://api.sambanova.ai/v1",
    loginUrl: "https://cloud.sambanova.ai",
  }),
];

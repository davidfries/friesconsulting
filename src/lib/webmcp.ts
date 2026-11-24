import { business, faqs, posts, services } from "../generated/content";
import { calculatePrivateCloudTco, formatCurrency } from "./tco";

interface ModelContextToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

interface ModelContextContainer {
  registerTool?: (
    tool: ModelContextToolDefinition,
    options?: { signal?: AbortSignal }
  ) => Promise<void> | void;
}

declare global {
  interface Document {
    modelContext?: ModelContextContainer;
  }
  interface Navigator {
    modelContext?: ModelContextContainer;
  }
}

export function registerWebMcpTools(): () => void {
  if (typeof window === "undefined") return () => {};

  // W3C WebMCP specification uses document.modelContext (with navigator fallback for early previews).
  const context = document.modelContext ?? navigator.modelContext;
  if (!context || typeof context.registerTool !== "function") {
    return () => {};
  }

  const controller = new AbortController();

  const tools: ModelContextToolDefinition[] = [
    {
      name: "get_business_profile",
      description:
        "Return authoritative facts about Fries Consulting Services, LLC: service areas (Denver & Northern Colorado on-site, US remote), target audiences (non-profits, charter/K-12 schools, small businesses), E-Rate/CIPA expertise, engagement model, pricing approach, and FAQs.",
      inputSchema: {
        type: "object",
        properties: {
          includeFaqs: {
            type: "boolean",
            description: "Include all 11 frequently asked questions and answers.",
          },
        },
      },
      execute: async (args) => {
        return {
          legalName: business.legalName,
          name: business.name,
          founder: business.founder,
          website: business.baseUrl,
          serviceArea: business.serviceArea,
          audiences: business.audiences,
          sectorFocus: business.sectorFocus,
          eRateSummary: business.eRateSummary,
          cipaSummary: business.cipaSummary,
          engagementModel: business.engagementModel,
          pricingModel: business.pricingModel,
          contactChannel: {
            url: `${business.baseUrl}${business.contactPath}`,
            note: business.contactChannelNote,
            requiredScopingPoints: business.contactChecklist,
          },
          technologies: business.technologies,
          ...(args.includeFaqs ? { faqs: faqs.map((f) => ({ q: f.q, a: f.answerPlain })) } : {}),
        };
      },
    },
    {
      name: "search_services",
      description:
        "Search or filter Fries Consulting Services offerings by keyword, category, or audience (non-profits, schools, small-business).",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Free-text keyword such as 'proxmox', 'e-rate', 'cipa', 'aws', 'monitoring', 'ransomware', or 'ollama'.",
          },
          audience: {
            type: "string",
            enum: ["non-profits", "schools", "small-business"],
            description: "Optional audience filter.",
          },
          category: {
            type: "string",
            description: "Optional category name filter.",
          },
        },
      },
      execute: async (args) => {
        const query = String(args.query ?? "").trim().toLowerCase();
        const audience = args.audience ? String(args.audience) : undefined;
        const category = args.category ? String(args.category).toLowerCase() : undefined;

        const matches = services.filter((svc) => {
          if (audience && !svc.audiences.includes(audience as "schools" | "non-profits" | "small-business")) {
            return false;
          }
          if (category && !svc.category.toLowerCase().includes(category)) {
            return false;
          }
          if (!query) return true;
          const haystack = `${svc.name} ${svc.category} ${svc.summary} ${svc.detailsMarkdown} ${svc.tags.join(" ")}`.toLowerCase();
          return haystack.includes(query);
        });

        return {
          count: matches.length,
          services: matches.map((s) => ({
            id: s.id,
            name: s.name,
            category: s.category,
            audiences: s.audiences,
            url: `${business.baseUrl}/services/#${s.id}`,
            primaryUrl: `${business.baseUrl}${s.primaryUrl}`,
            summary: s.summary,
            tags: s.tags,
          })),
        };
      },
    },
    {
      name: "search_writing",
      description:
        "Search technical articles and production case studies written by Fries Consulting Services (e.g., local LLM CIPA filter logs, Proxmox/Ceph private cloud costs, AWS IaC, network audits).",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search term across post titles, summaries, keywords, and content.",
          },
          slug: {
            type: "string",
            description: "Optional exact post slug (e.g. 'local-llm', 'privatecloud', 'proxmox').",
          },
          includeFullMarkdown: {
            type: "boolean",
            description: "When true, includes full Markdown text for matched posts.",
          },
        },
      },
      execute: async (args) => {
        const slug = args.slug ? String(args.slug).trim() : undefined;
        const query = String(args.query ?? "").trim().toLowerCase();
        const includeFull = Boolean(args.includeFullMarkdown);

        const matches = posts.filter((post) => {
          if (slug) return post.slug === slug;
          if (!query) return true;
          const haystack = `${post.title} ${post.summary} ${post.keywords.join(" ")} ${post.markdown}`.toLowerCase();
          return haystack.includes(query);
        });

        return {
          count: matches.length,
          posts: matches.map((p) => ({
            slug: p.slug,
            title: p.title,
            date: p.dateFormatted,
            url: `${business.baseUrl}${p.url}`,
            markdownUrl: `${business.baseUrl}/posts/${p.slug}.md`,
            summary: p.summary,
            keywords: p.keywords,
            readingMinutes: p.readingMinutes,
            ...(includeFull ? { markdown: p.markdown } : {}),
          })),
        };
      },
    },
    {
      name: "estimate_private_cloud_tco",
      description:
        "Estimate hardware BOM and break-even timeline for an on-premises Proxmox VE + Ceph private cloud cluster versus equivalent AWS EC2 compute.",
      inputSchema: {
        type: "object",
        properties: {
          vmCount: { type: "integer", minimum: 1, maximum: 24, description: "Number of virtual machines (default 6)." },
          vcpuPerVm: { type: "integer", minimum: 1, maximum: 16, description: "vCPUs per VM (default 4)." },
          ramGbPerVm: { type: "integer", minimum: 2, maximum: 64, description: "RAM in GB per VM (default 8)." },
          storageGbPerVm: { type: "integer", minimum: 50, maximum: 4000, description: "Storage in GB per VM (default 500)." },
          awsTerm: {
            type: "string",
            enum: ["1yr-reserved", "on-demand"],
            description: "AWS EC2 pricing model (default '1yr-reserved').",
          },
          includeAwsStorageAndEgress: {
            type: "boolean",
            description: "Include estimated AWS EBS gp3 storage, snapshots, and egress costs.",
          },
          annualOpsAndPower: {
            type: "number",
            minimum: 0,
            maximum: 25000,
            description: "Optional annual on-premises power, cooling, and hardware reserve in USD.",
          },
        },
      },
      execute: async (args) => {
        const result = calculatePrivateCloudTco({
          vmCount: typeof args.vmCount === "number" ? args.vmCount : undefined,
          vcpuPerVm: typeof args.vcpuPerVm === "number" ? args.vcpuPerVm : undefined,
          ramGbPerVm: typeof args.ramGbPerVm === "number" ? args.ramGbPerVm : undefined,
          storageGbPerVm: typeof args.storageGbPerVm === "number" ? args.storageGbPerVm : undefined,
          awsTerm: args.awsTerm === "on-demand" ? "on-demand" : "1yr-reserved",
          includeAwsStorageAndEgress: Boolean(args.includeAwsStorageAndEgress),
          annualOpsAndPower:
            typeof args.annualOpsAndPower === "number" ? args.annualOpsAndPower : undefined,
        });

        return {
          clusterSummary: `${result.nodeCount}x Minisforum MS-01 (${result.ramPerNodeGb} GB RAM, 3x ${result.nvmeTbPerNode} TB NVMe)`,
          clusterUpfrontCost: result.clusterUpfrontCost,
          clusterUpfrontFormatted: formatCurrency(result.clusterUpfrontCost),
          awsEquivalent: `${result.inputs.vmCount}x ${result.awsInstanceType} (${result.inputs.awsTerm})`,
          awsAnnualTotal: result.awsAnnualTotal,
          awsAnnualFormatted: formatCurrency(result.awsAnnualTotal),
          breakEvenMonths: result.breakEvenMonths,
          threeYearSavings: result.threeYearSavings,
          fiveYearSavings: result.fiveYearSavings,
          fitAssessment: result.fitAssessment,
          hardwareBom: result.hardwareBom,
        };
      },
    },
    {
      name: "draft_scoping_inquiry",
      description:
        "Format a structured project scoping inquiry for Fries Consulting Services ready for the human prospective client to review and submit via https://friesconsulting.services/contact/. Never auto-submits.",
      inputSchema: {
        type: "object",
        properties: {
          environment: { type: "string", description: "User/site count and current infrastructure." },
          problem: { type: "string", description: "What is broken, too expensive, undocumented, or needs to be built." },
          timeline: { type: "string", description: "Target dates, renewals, audits, or academic windows." },
          internalItStaff: { type: "string", description: "Whether internal IT staff exist and decision makers." },
          budget: { type: "string", description: "Optional approved budget or E-Rate/fiscal cycle." },
        },
        required: ["environment", "problem"],
      },
      execute: async (args) => {
        const lines = [
          `Environment: ${String(args.environment)}`,
          `Problem / Goal: ${String(args.problem)}`,
          args.timeline ? `Timeline / Hard Dates: ${String(args.timeline)}` : "Timeline / Hard Dates: Flexible / scoping",
          args.internalItStaff ? `IT Staffing & Stakeholders: ${String(args.internalItStaff)}` : "IT Staffing & Stakeholders: Not specified",
          args.budget ? `Budget / Funding Cycle: ${String(args.budget)}` : null,
        ].filter(Boolean);

        const draftedMessage = lines.join("\n\n");
        const contactUrl = `${business.baseUrl}${business.contactPath}`;
        return {
          draftedMessage,
          contactFormUrl: contactUrl,
          instructionForAssistant:
            "Present this drafted scoping message to the user so they can review and submit it directly on the contact form.",
        };
      },
    },
  ];

  for (const tool of tools) {
    try {
      Promise.resolve(context.registerTool(tool, { signal: controller.signal })).catch(() => {
        // Ignore browser-specific unsupported registration errors.
      });
    } catch {
      // Ignore if registerTool signature throws synchronously.
    }
  }

  return () => controller.abort();
}

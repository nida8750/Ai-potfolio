-- Catalog seed for project wpdslwonqowelbrublju.
-- Idempotent on slug. The Next.js repository also seeds if these tables are empty.

insert into public.services (
  slug, title, description, short_description, technologies, price, currency,
  pricing_type, icon, is_active, featured, sort_order
)
values
  (
    'ai-agents',
    'AI Agents',
    'Multi-agent systems, task automation, tool calling, and MCP integration.',
    'Multi-agent systems, task automation, tool calling, and MCP integration.',
    array['LangGraph', 'CrewAI', 'AutoGen', 'MCP'],
    null,
    'USD',
    'custom',
    'agents',
    true,
    true,
    0
  ),
  (
    'rag-knowledge-systems',
    'RAG & Knowledge Systems',
    'Semantic search, vector databases, document processing, and grounded responses.',
    'Semantic search, vector databases, document processing, and grounded responses.',
    array['MongoDB', 'Pinecone', 'ChromaDB', 'LlamaIndex'],
    null,
    'USD',
    'custom',
    'rag',
    true,
    false,
    1
  ),
  (
    'business-automation',
    'Business Automation',
    'n8n workflows, CRM integration, API automation, and email and webhook systems.',
    'n8n workflows, CRM integration, API automation, and email and webhook systems.',
    array['n8n', 'Make', 'Zapier', 'REST APIs'],
    null,
    'USD',
    'custom',
    'automation',
    true,
    false,
    2
  ),
  (
    'voice-ai',
    'Voice AI',
    'Voice assistants, customer support, sales agents, and real-time communication.',
    'Voice assistants, customer support, sales agents, and real-time communication.',
    array['STT', 'LLM', 'TTS', 'WebSockets'],
    null,
    'USD',
    'custom',
    'voice',
    true,
    false,
    3
  )
on conflict (slug) do nothing;

insert into public.projects (
  title, slug, category, description, technologies, image, featured, is_published, sort_order
)
values
  (
    'Multi-Agent Business Automation',
    'multi-agent-business-automation',
    'AI Agents + Automation',
    'A complete system where multiple AI agents handle business workflows, CRM updates, email follow-ups, and more.',
    array['LangGraph', 'CrewAI', 'n8n', 'MongoDB'],
    '/images/projects/multi-agent-business-automation.svg',
    true,
    true,
    0
  ),
  (
    'AI Knowledge Base Copilot',
    'ai-knowledge-base-copilot',
    'RAG System',
    'Chat with your documents using retrieval-augmented generation with citations, secure access, and a dashboard.',
    array['React', 'FastAPI', 'Pinecone', 'MongoDB'],
    '/images/projects/rag-copilot.svg',
    true,
    true,
    1
  ),
  (
    'Voice Agent Assistant',
    'voice-agent-assistant',
    'Voice AI',
    'Real-time voice support built from speech-to-text, an LLM reasoning step, and text-to-speech.',
    array['FastAPI', 'Twilio', 'MongoDB', 'WebSockets'],
    '/images/projects/voice-support-agent.svg',
    true,
    true,
    2
  ),
  (
    'CRM Automation Pipeline',
    'crm-automation-pipeline',
    'Automation',
    'A pipeline concept that connects inbound events to CRM updates, routing, and follow-up without manual copy-paste.',
    array['n8n', 'REST APIs', 'Webhooks', 'CRM Automation'],
    '/images/projects/crm-automation.svg',
    true,
    true,
    3
  )
on conflict (slug) do nothing;

insert into public.platform_settings (id, default_currency, payment_provider, bookings_enabled)
values ('platform', 'USD', 'none', true)
on conflict (id) do nothing;

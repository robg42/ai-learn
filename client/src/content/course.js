export const SECTIONS = [
  {
    id: 'llm-basics',
    title: 'LLM Fundamentals',
    description: 'Understand how large language models work, who builds them, and how to use them effectively.',
    icon: 'Brain',
    color: '#6366f1',
    subsections: [
      {
        id: 'what-are-llms',
        title: 'What Are Large Language Models?',
        estimatedMinutes: 8,
        visual: 'LLMConceptDiagram',
        content: `Large Language Models (LLMs) are a class of AI systems trained on vast corpora of text to understand and generate human language. Unlike earlier rule-based NLP systems, LLMs learn statistical patterns from billions of documents — books, websites, code, scientific papers — and use those patterns to predict what text should come next.

The term "large" refers to two things: the size of the training data and the number of parameters in the model. Parameters are the numerical weights that define how the model processes information. Modern frontier models contain hundreds of billions of parameters, allowing them to encode a remarkable breadth of knowledge and reasoning capability.

LLMs are not databases or search engines. They do not look up facts from a stored index. Instead, they generate text token by token, with each token influenced by everything that came before it in the conversation. This generative process is why LLMs can write code, explain concepts, translate languages, and hold open-ended conversations — but also why they can confidently produce incorrect information.

Understanding LLMs as probabilistic text generators — rather than thinking agents or fact repositories — is foundational to using them well and building reliable systems on top of them.`,
        quiz: [
          {
            id: 'llm-q1',
            question: 'What does "large" refer to in Large Language Models?',
            type: 'multi',
            options: [
              'The physical size of the servers running them',
              'The number of parameters in the model',
              'The volume of training data used',
              'The length of responses they generate'
            ],
            correct: [1, 2],
            explanation: '"Large" refers to both the scale of training data (billions of documents) and the number of model parameters (the learned weights). Physical server size and response length are not what the term describes.'
          },
          {
            id: 'llm-q2',
            question: 'How do LLMs generate their responses?',
            type: 'single',
            options: [
              'By searching a database of pre-written answers',
              'By executing deterministic logic rules',
              'By predicting tokens one at a time based on context',
              'By retrieving the closest matching training example'
            ],
            correct: [2],
            explanation: 'LLMs generate text autoregressively — predicting the next token given all previous tokens. They do not search databases or apply rule-based logic.'
          },
          {
            id: 'llm-q3',
            question: 'Why can LLMs produce incorrect information confidently?',
            type: 'single',
            options: [
              'Their training data is always outdated',
              'They optimize for plausible-sounding text, not factual accuracy',
              'They deliberately deceive users',
              'Their parameters are too small to store facts'
            ],
            correct: [1],
            explanation: 'LLMs are trained to generate statistically likely continuations of text. This means they can produce fluent, confident-sounding text that is factually wrong — a phenomenon called hallucination.'
          },
          {
            id: 'llm-q4',
            question: 'Which best describes parameters in an LLM?',
            type: 'single',
            options: [
              'The prompts fed into the model at inference time',
              'The numerical weights learned during training',
              'The rules hard-coded by engineers',
              'The tokens in the model\'s vocabulary'
            ],
            correct: [1],
            explanation: 'Parameters are the numerical weights that define the model\'s behavior. They are learned during training via gradient descent and are not changed at inference time.'
          }
        ]
      },
      {
        id: 'transformers-and-tokens',
        title: 'Transformers & Tokenisation',
        estimatedMinutes: 10,
        visual: 'TokenVisualiser',
        content: `The transformer architecture, introduced in the 2017 paper "Attention Is All You Need," is the backbone of every major LLM. Its key innovation is the self-attention mechanism, which allows every token in a sequence to directly attend to every other token, capturing long-range dependencies that earlier recurrent networks struggled with.

Before an LLM processes text, the input is split into tokens. A token is typically a word fragment — not a full word, not a single character. The word "tokenisation" might become ["token", "isation"]. Numbers, punctuation, and code have their own tokenisation patterns. Most frontier models use vocabularies of 50,000–100,000 tokens.

Tokenisation matters for practical reasons. The model's context window is measured in tokens, not words. A typical English word is about 1.3 tokens. Code is often more token-dense. Prices for commercial APIs are charged per token. And some languages (like Chinese or Arabic) tokenise very differently from English, which affects performance.

Transformers use positional encodings to preserve order information, since self-attention itself is permutation-invariant. The feedforward layers after attention apply nonlinear transformations that give the model expressive power beyond pattern matching. Stacking many such layers (often 96+ in frontier models) is what allows complex reasoning to emerge.`,
        quiz: [
          {
            id: 'tok-q1',
            question: 'What was the key innovation of the transformer architecture?',
            type: 'single',
            options: [
              'Recurrent state that persists across sequences',
              'Self-attention allowing all tokens to attend to each other',
              'Convolutional filters for text feature extraction',
              'Symbolic rule engines for grammar'
            ],
            correct: [1],
            explanation: 'The transformer\'s self-attention mechanism lets every token in a sequence attend to every other token simultaneously, overcoming the long-range dependency limitations of RNNs.'
          },
          {
            id: 'tok-q2',
            question: 'Why does tokenisation matter when using LLM APIs?',
            type: 'multi',
            options: [
              'API costs are billed per token',
              'Context window limits are measured in tokens',
              'Token count determines model accuracy',
              'Non-English text may tokenise differently'
            ],
            correct: [0, 1, 3],
            explanation: 'API pricing, context limits, and cross-lingual behaviour all hinge on tokenisation. Token count alone does not determine accuracy.'
          },
          {
            id: 'tok-q3',
            question: 'Approximately how many tokens does a typical English word correspond to?',
            type: 'single',
            options: ['0.5 tokens', '1.3 tokens', '3 tokens', '10 tokens'],
            correct: [1],
            explanation: 'On average, one English word is about 1.3 tokens with common tokenisers like BPE. Rare or compound words may be more.'
          }
        ]
      },
      {
        id: 'llm-providers',
        title: 'Major Providers & Models',
        estimatedMinutes: 7,
        visual: 'ProviderComparison',
        content: `The frontier LLM landscape is dominated by a small number of well-resourced organisations, each taking somewhat different approaches to capability, safety, and deployment.

Anthropic builds the Claude family of models, emphasising Constitutional AI and safety research. Claude models are available via the Anthropic API and are designed with helpfulness, harmlessness, and honesty as core objectives. The Claude 3 and Claude 4 series include models at different capability/cost tiers: Haiku for fast, cheap tasks; Sonnet for balanced performance; Opus for maximum capability.

OpenAI produces the GPT series and the o-series reasoning models. GPT-4o is their flagship multimodal model; o1 and o3 are designed for complex multi-step reasoning through extended chain-of-thought. OpenAI also operates ChatGPT as a consumer product.

Google DeepMind develops the Gemini family, integrated into Google Cloud (Vertex AI) and consumer products. Gemini models have exceptionally large context windows and strong multimodal capabilities.

Meta releases Llama models as open weights, allowing download and local deployment. This has spawned a large ecosystem of fine-tunes and derivative models. Other notable open-weight providers include Mistral AI and the Allen Institute.

Choosing a provider involves evaluating benchmark performance, pricing, context window, latency, data privacy terms, and geographic availability. No single provider dominates on all dimensions.`,
        quiz: [
          {
            id: 'prov-q1',
            question: 'Which organisation developed Constitutional AI as a safety approach?',
            type: 'single',
            options: ['OpenAI', 'Google DeepMind', 'Anthropic', 'Meta'],
            correct: [2],
            explanation: 'Anthropic developed Constitutional AI, a technique for training models to be helpful, harmless, and honest using a set of principles.'
          },
          {
            id: 'prov-q2',
            question: 'What distinguishes open-weight models like Llama from API-only models?',
            type: 'single',
            options: [
              'They are always more capable',
              'They can be downloaded and run locally',
              'They have no usage costs',
              'They do not require GPUs'
            ],
            correct: [1],
            explanation: 'Open-weight models release the model weights publicly, enabling local deployment. They may still have hardware costs and do not guarantee superior capability.'
          },
          {
            id: 'prov-q3',
            question: 'Which factors should influence your choice of LLM provider? (select all that apply)',
            type: 'multi',
            options: [
              'Benchmark performance on relevant tasks',
              'Pricing and token costs',
              'Data privacy and terms of service',
              'The provider\'s founding year'
            ],
            correct: [0, 1, 2],
            explanation: 'Performance, cost, and data privacy are practical selection criteria. Founding year is generally not relevant to capability or suitability.'
          }
        ]
      },
      {
        id: 'prompting-basics',
        title: 'Prompt Engineering Fundamentals',
        estimatedMinutes: 9,
        content: `Prompt engineering is the practice of crafting inputs to LLMs to reliably elicit the outputs you want. Because LLMs are sensitive to phrasing, structure, and context, small changes to a prompt can dramatically change the quality and format of responses.

The system prompt sets the model's persona, constraints, and output format. It runs before the user's message and is a powerful lever for shaping model behaviour. A well-written system prompt can enforce response formats, restrict topics, set tone, and provide reference information.

Few-shot prompting means including examples of desired input-output pairs directly in the prompt. This is especially effective for tasks with unusual output formats or domain-specific requirements. One to five high-quality examples usually suffice.

Chain-of-thought (CoT) prompting instructs the model to reason step by step before giving a final answer. This technique substantially improves accuracy on arithmetic, logic, and multi-step reasoning tasks. Simply adding "Think step by step" to a prompt often helps.

Retrieval-Augmented Generation (RAG) is a pattern where relevant documents are fetched from a knowledge base and injected into the prompt context. This grounds the model's responses in up-to-date, specific information, reducing hallucination on factual queries.

Common pitfalls include under-specifying the task (leading to generic outputs), including contradictory instructions, and not testing prompts against edge cases. Treat prompt engineering as software engineering: version-control your prompts, test them, and iterate.`,
        quiz: [
          {
            id: 'pe-q1',
            question: 'What is the purpose of a system prompt?',
            type: 'single',
            options: [
              'To provide the user\'s question to the model',
              'To set persona, constraints, and output format before the conversation',
              'To store conversation history',
              'To select which model version to use'
            ],
            correct: [1],
            explanation: 'The system prompt runs before user messages and shapes overall model behaviour — persona, tone, format, restrictions, and context.'
          },
          {
            id: 'pe-q2',
            question: 'Chain-of-thought prompting helps most with which type of task?',
            type: 'single',
            options: [
              'Simple factual lookups',
              'Image generation',
              'Multi-step reasoning and arithmetic',
              'Code auto-completion'
            ],
            correct: [2],
            explanation: 'CoT prompting, which instructs the model to reason step by step, shows the largest gains on tasks requiring sequential reasoning, maths, and logic.'
          },
          {
            id: 'pe-q3',
            question: 'What does RAG (Retrieval-Augmented Generation) primarily address?',
            type: 'single',
            options: [
              'Reducing model parameter count',
              'Grounding responses in specific, up-to-date documents to reduce hallucination',
              'Speeding up inference time',
              'Replacing fine-tuning entirely'
            ],
            correct: [1],
            explanation: 'RAG retrieves relevant documents and injects them into the prompt, giving the model specific factual grounding and reducing reliance on parametric memory.'
          },
          {
            id: 'pe-q4',
            question: 'Which practices apply to professional prompt engineering? (select all that apply)',
            type: 'multi',
            options: [
              'Version-controlling prompts',
              'Testing against edge cases',
              'Writing prompts once and never changing them',
              'Including relevant few-shot examples'
            ],
            correct: [0, 1, 3],
            explanation: 'Good prompt engineering mirrors software engineering: version control, testing, and using examples. Prompts should be iterated, not set-and-forgotten.'
          }
        ]
      },
      {
        id: 'llm-capabilities',
        title: 'Capabilities & Limitations',
        estimatedMinutes: 8,
        visual: 'CapabilityRadar',
        content: `Modern LLMs excel at a wide range of tasks: summarisation, translation, code generation, question answering, creative writing, data extraction, and classification. Their broad capability comes from training on diverse text, which exposes them to patterns from many domains simultaneously.

Reasoning capability has improved dramatically with scale and with techniques like reinforcement learning from human feedback (RLHF) and process reward models. The o1/o3 class of models can tackle complex maths olympiad problems and PhD-level science questions — tasks that were impossible for earlier models.

However, LLMs have fundamental limitations. Hallucination — generating plausible but false information — remains an unsolved problem. Models will confidently cite non-existent papers, misstate statistics, and fabricate quotes. For any high-stakes factual use case, outputs must be verified.

LLMs lack persistent memory by default. Each conversation begins fresh. If continuity matters, it must be engineered via conversation history, vector databases, or external storage.

Models also have a knowledge cutoff: they know nothing about events after their training data was collected. For time-sensitive applications, RAG or tool use is necessary.

Bias is another concern. Models learn from human-generated text, which contains historical biases around gender, race, and culture. These biases can surface in model outputs and require active mitigation.

Finally, LLMs are not reliable calculators or code executors. They make arithmetic errors and generate code with bugs. Attaching tools (a Python interpreter, a calculator, a web search) is the correct solution for precision tasks.`,
        quiz: [
          {
            id: 'cap-q1',
            question: 'What is "hallucination" in the context of LLMs?',
            type: 'single',
            options: [
              'The model generating text in a non-English language',
              'Confidently producing plausible but factually incorrect information',
              'Responses that are overly creative',
              'The model refusing to answer a question'
            ],
            correct: [1],
            explanation: 'Hallucination refers to LLMs generating false information presented with apparent confidence — fabricated citations, wrong statistics, invented quotes.'
          },
          {
            id: 'cap-q2',
            question: 'What is the correct approach when an LLM needs to perform precise arithmetic?',
            type: 'single',
            options: [
              'Ask the model to try harder',
              'Use a larger model',
              'Attach a tool such as a code interpreter or calculator',
              'Include more examples in the prompt'
            ],
            correct: [2],
            explanation: 'LLMs are not reliable calculators. Tool use — attaching a Python interpreter or dedicated calculator — provides the precision that parametric generation cannot.'
          },
          {
            id: 'cap-q3',
            question: 'Which limitations apply to standard LLMs? (select all that apply)',
            type: 'multi',
            options: [
              'No persistent memory across conversations by default',
              'Knowledge cutoff after training date',
              'Potential for biased outputs',
              'Inability to process more than 100 tokens'
            ],
            correct: [0, 1, 2],
            explanation: 'Default LLMs lack persistent memory, have training cutoffs, and inherit biases from training data. Modern models can process tens of thousands of tokens, not just 100.'
          }
        ]
      },
      {
        id: 'llm-use-cases',
        title: 'Real-World Use Cases',
        estimatedMinutes: 6,
        content: `LLMs are being deployed across virtually every industry, transforming workflows that previously required significant human expertise and time.

In software development, LLMs act as coding assistants (GitHub Copilot, Cursor), generate tests, explain legacy code, write documentation, and help debug. Studies suggest developer productivity increases of 30–55% for certain tasks when AI assistance is used well.

Customer support is one of the highest-adoption enterprise use cases. LLMs power chatbots that handle tier-1 queries, draft responses for human agents, summarise ticket history, and route issues. The economics are compelling: a well-deployed LLM can handle thousands of simultaneous conversations at a fraction of human cost.

In legal and compliance, LLMs review contracts, extract key clauses, flag risks, and summarise case law. Given the volume of documents in legal work, this is a genuine productivity multiplier — though outputs require expert review.

Healthcare applications include summarising clinical notes, drafting patient communications, assisting with medical coding, and literature review. Regulatory constraints (HIPAA, EU AI Act) mean careful deployment is mandatory.

Content creation and marketing teams use LLMs to draft copy, adapt content for different audiences, generate social media variations, and support SEO research.

Education is another major domain: personalised tutoring, automated feedback on student writing, curriculum generation, and accessibility tools for learners with disabilities.

The pattern across all successful deployments is using LLMs to augment human expertise rather than replace it — handling high-volume, lower-stakes tasks while keeping humans in the loop for consequential decisions.`,
        quiz: [
          {
            id: 'uc-q1',
            question: 'What is the common pattern across successful enterprise LLM deployments?',
            type: 'single',
            options: [
              'Fully replacing human workers in decision-making roles',
              'Using LLMs only for creative tasks',
              'Augmenting human expertise and handling high-volume tasks with human oversight',
              'Deploying LLMs only in non-regulated industries'
            ],
            correct: [2],
            explanation: 'The successful pattern is augmentation — LLMs handle volume and routine tasks, while humans review and decide on consequential matters.'
          },
          {
            id: 'uc-q2',
            question: 'Which real-world LLM use cases are well-established? (select all that apply)',
            type: 'multi',
            options: [
              'Code generation and developer assistance',
              'Customer support chatbots',
              'Fully autonomous medical diagnosis without oversight',
              'Contract review and clause extraction'
            ],
            correct: [0, 1, 3],
            explanation: 'Code assistance, customer support, and contract review are mature, widely deployed use cases. Fully autonomous medical diagnosis without human oversight is not an established or safe use case.'
          }
        ]
      }
    ]
  },

  {
    id: 'agentic-ai',
    title: 'Agentic AI',
    description: 'Learn how AI agents are built, how they use tools, manage memory, and collaborate in multi-agent systems.',
    icon: 'Bot',
    color: '#10b981',
    subsections: [
      {
        id: 'what-is-agentic-ai',
        title: 'What Is Agentic AI?',
        estimatedMinutes: 8,
        visual: 'AgentLoopDiagram',
        content: `Agentic AI refers to systems where a language model is given the ability to take actions in the world — not just generate text, but call tools, browse the web, write and execute code, send messages, or manipulate files — in pursuit of a goal over multiple steps.

The shift from LLM-as-assistant to LLM-as-agent is fundamental. A chat assistant responds once to each message. An agent operates in a loop: perceive the environment, decide on an action, execute it, observe the result, and repeat until the goal is achieved or it needs to ask for guidance.

This loop is often called the ReAct pattern (Reason + Act): the model reasons about its situation, selects an action, observes the outcome, and reasons again. More sophisticated agents use planning algorithms that look ahead multiple steps, or reflection mechanisms that critique and revise their own outputs.

Agentic systems introduce new failure modes. Agents can get stuck in loops, take unintended side effects, run up API costs autonomously, or be manipulated by malicious content in their environment. The degree of autonomy granted to an agent must be calibrated to the stakes of the task and the reliability of the model.

The key enablers of modern agentic AI are: large context windows (so agents can track long task histories), reliable tool use / function calling (so models can take structured actions), and improved instruction following (so models stay on task across many steps).`,
        quiz: [
          {
            id: 'agent-q1',
            question: 'What fundamentally distinguishes an AI agent from a simple chat assistant?',
            type: 'single',
            options: [
              'Agents use larger models',
              'Agents operate in a perception-action loop to pursue goals over multiple steps',
              'Agents only work with structured data',
              'Agents do not use language models'
            ],
            correct: [1],
            explanation: 'The defining characteristic of an agent is the perception-action loop: observe, reason, act, repeat. Chat assistants respond once per message and take no external actions.'
          },
          {
            id: 'agent-q2',
            question: 'What is the ReAct pattern?',
            type: 'single',
            options: [
              'A React.js framework for AI applications',
              'A pattern combining reasoning and acting in an interleaved loop',
              'A reinforcement learning algorithm',
              'A method for compressing model weights'
            ],
            correct: [1],
            explanation: 'ReAct (Reason + Act) is a prompting and agent design pattern where the model alternates between reasoning about its situation and taking actions.'
          },
          {
            id: 'agent-q3',
            question: 'Which new failure modes do agentic systems introduce? (select all that apply)',
            type: 'multi',
            options: [
              'Infinite action loops',
              'Unintended side effects from tool use',
              'Inability to generate text',
              'Manipulation via malicious content in the environment'
            ],
            correct: [0, 1, 3],
            explanation: 'Agents can loop indefinitely, cause side effects through tools, and be hijacked by prompt injection in external content. Loss of text generation ability is not an agentic failure mode.'
          }
        ]
      },
      {
        id: 'agent-components',
        title: 'Agent Architecture & Components',
        estimatedMinutes: 9,
        content: `A well-designed agent architecture has several distinct components that work together to enable reliable multi-step task completion.

The core model (LLM) serves as the "brain" — it reasons, plans, and decides which action to take next. The quality of the underlying model directly determines the agent's capability ceiling.

The tool registry is the set of functions or APIs the agent can call. Tools are described in the system prompt (or a dedicated tools parameter) with their names, descriptions, and input schemas. The model selects tools and provides arguments; the framework executes them and returns results. Well-designed tools have clear, unambiguous descriptions and return structured, informative outputs.

Memory in agents comes in several forms: in-context memory (the conversation history within the current context window), external short-term memory (a session store), and external long-term memory (vector databases that can be searched semantically). Choosing the right memory architecture depends on task duration and the volume of relevant information.

The orchestrator manages the agent loop: routing messages, calling tools, injecting tool results back into context, and deciding when to return control to the user or stop. Frameworks like LangChain, LlamaIndex, and the Anthropic Agent SDK provide orchestration scaffolding.

Finally, a guardrail layer can wrap the agent to validate inputs and outputs — checking that tool calls are within allowed scope, that outputs meet format requirements, and that the agent hasn't been manipulated.

Designing agents is an engineering discipline. Reliability comes from clear tool contracts, good observability (logging all LLM calls and tool uses), fail-safe defaults, and thorough testing against adversarial inputs.`,
        quiz: [
          {
            id: 'arch-q1',
            question: 'What is the purpose of a tool registry in an agent?',
            type: 'single',
            options: [
              'To store conversation history',
              'To define the set of functions the agent can call, with descriptions and schemas',
              'To compress the model\'s weights',
              'To manage user authentication'
            ],
            correct: [1],
            explanation: 'The tool registry defines what actions the agent can take — the names, descriptions, and input schemas of callable functions. The model uses this to decide which tool to invoke.'
          },
          {
            id: 'arch-q2',
            question: 'Which forms of memory can agents use? (select all that apply)',
            type: 'multi',
            options: [
              'In-context memory (conversation history)',
              'External vector databases for semantic search',
              'Hard-coded lookup tables in model weights',
              'Session stores for short-term state'
            ],
            correct: [0, 1, 3],
            explanation: 'Agents use in-context memory, external short-term stores, and vector databases. Hard-coded lookup tables in weights are not a distinct memory architecture agents implement.'
          },
          {
            id: 'arch-q3',
            question: 'What does an orchestrator do in an agent system?',
            type: 'single',
            options: [
              'Trains the underlying language model',
              'Manages the agent loop: routing, tool execution, result injection, and stopping conditions',
              'Handles user login and permissions',
              'Optimises token usage by compressing prompts'
            ],
            correct: [1],
            explanation: 'The orchestrator manages the operational loop — executing tool calls, injecting results back into context, and deciding when the task is complete or needs user input.'
          }
        ]
      },
      {
        id: 'agent-tools',
        title: 'Tools & Function Calling',
        estimatedMinutes: 8,
        content: `Function calling (also called tool use) is the mechanism by which LLMs take structured actions. The model outputs a JSON object specifying a function name and arguments, rather than free text. The calling code executes the function and passes the result back to the model.

This is a crucial distinction from raw text generation. With tool use, the model's output is constrained to valid JSON matching a predefined schema, making it far more reliable for automated pipelines than parsing free text.

Effective tool design follows several principles. Tools should do one thing well — a tool that does many things is harder for the model to use correctly. Descriptions must be precise: the model infers when to use a tool from its description, so ambiguity leads to wrong selections or missed usage. Input schemas should be strict but not over-constrained.

Common tool categories include: web search and browsing, code execution (running Python/JS in a sandbox), file read/write, database queries, external API calls (calendar, email, CRM), and sub-agent invocation.

Error handling in tools is critical. Tools should return informative error messages — not just a generic failure — so the model can reason about what went wrong and try an alternative approach. Tools should also be idempotent where possible, or clearly document when they are not, since agents may retry on apparent failure.

Security of tool use is a major concern. A compromised tool, or a model tricked by prompt injection, can take harmful real-world actions. Privilege should be minimal: tools should only have access to what is genuinely needed for the task.`,
        quiz: [
          {
            id: 'tools-q1',
            question: 'What is the key difference between function calling and free-text generation?',
            type: 'single',
            options: [
              'Function calling is slower',
              'The model outputs structured JSON matched to a predefined schema rather than free text',
              'Function calling requires a separate model',
              'Free text is more reliable for automated pipelines'
            ],
            correct: [1],
            explanation: 'Function calling constrains the model output to structured JSON matching a schema, making it far more reliable for automated tool execution than parsing free text.'
          },
          {
            id: 'tools-q2',
            question: 'Why should tool descriptions be precise?',
            type: 'single',
            options: [
              'To reduce the size of the system prompt',
              'The model infers when to use a tool from its description — ambiguity causes wrong selections',
              'Precise descriptions improve model training',
              'They are required by the API specification'
            ],
            correct: [1],
            explanation: 'The LLM decides which tool to use based on its description. Vague or overlapping descriptions lead to incorrect or missed tool calls.'
          },
          {
            id: 'tools-q3',
            question: 'Which security principle should guide tool design in agents?',
            type: 'single',
            options: [
              'Tools should have broad permissions to handle edge cases',
              'Tools should be given minimal privilege — only what the task genuinely requires',
              'All tools should be publicly accessible',
              'Security is only relevant for production deployments'
            ],
            correct: [1],
            explanation: 'Minimal privilege is fundamental: if an agent\'s tools have only the access needed, the blast radius of a mistake or attack is limited.'
          }
        ]
      },
      {
        id: 'agent-memory',
        title: 'Memory & Context Management',
        estimatedMinutes: 7,
        content: `Memory management is one of the most important and underappreciated engineering challenges in agentic systems. An agent with poor memory architecture will forget crucial context, repeat actions, or fail on tasks that exceed the context window.

In-context memory is the simplest form: the full conversation history in the active context window. It requires no external infrastructure and is perfectly reliable — the model sees everything. The limitation is size: context windows, though growing (some models now support millions of tokens), are finite and expensive.

For long-running tasks, conversation compression or summarisation is essential. Rather than keeping every message verbatim, a background process (or the model itself) summarises older turns into a compact representation. This preserves semantic content while dramatically reducing token usage.

External memory stores extend the agent's effective memory beyond any context limit. Vector databases (Pinecone, Weaviate, pgvector) store embeddings of past interactions, documents, or observations. At each step, the agent queries the store for semantically relevant information and injects the top results into its context — a form of agent-level RAG.

Working memory and episodic memory serve different purposes. Working memory holds the current task state (what step am I on? what have I tried?). Episodic memory records past experiences (how did a similar task go before?). Sophisticated agents maintain both.

Key design decisions include: what to remember, when to write to memory, how to retrieve it, and when to forget. Over-cluttered memory degrades performance just as under-powered memory does.`,
        quiz: [
          {
            id: 'mem-q1',
            question: 'What is the main limitation of in-context memory?',
            type: 'single',
            options: [
              'It is unreliable and may hallucinate',
              'It is finite in size and costly for very long tasks',
              'It requires a vector database',
              'It cannot store structured data'
            ],
            correct: [1],
            explanation: 'In-context memory is reliable but bounded by the context window size and token cost. Very long tasks will exhaust it without additional memory strategies.'
          },
          {
            id: 'mem-q2',
            question: 'How do vector databases support agent memory?',
            type: 'single',
            options: [
              'By storing the full model weights',
              'By enabling semantic search over past interactions and documents to inject relevant context',
              'By replacing the language model entirely',
              'By providing real-time internet access'
            ],
            correct: [1],
            explanation: 'Vector databases store embeddings that can be searched semantically, allowing agents to retrieve relevant past context and inject it into their current prompt.'
          },
          {
            id: 'mem-q3',
            question: 'Why might over-cluttered memory harm agent performance?',
            type: 'single',
            options: [
              'It has no effect on performance',
              'Irrelevant information in context distracts the model and wastes tokens',
              'Memory always improves performance regardless of relevance',
              'Too much memory causes the model to retrain itself'
            ],
            correct: [1],
            explanation: 'Injecting too much irrelevant context dilutes the signal, wastes expensive tokens, and can cause the model to lose focus on the actual task.'
          }
        ]
      },
      {
        id: 'multi-agent-systems',
        title: 'Multi-Agent Systems',
        estimatedMinutes: 9,
        visual: 'MultiAgentFlow',
        content: `Multi-agent systems decompose complex tasks across multiple specialised agents that communicate and collaborate. Rather than one generalist agent trying to do everything, different agents handle planning, research, coding, review, and execution — each optimised for its role.

The orchestrator-worker pattern is the most common topology. An orchestrator agent breaks a high-level goal into subtasks and delegates them to worker agents. Each worker has its own tools, system prompt, and context. Results are returned to the orchestrator, which synthesises them and decides next steps.

Parallelism is a key benefit of multi-agent architectures. Tasks that are independent can be executed concurrently — a research agent and a code generation agent can work simultaneously on different parts of a project, dramatically reducing wall-clock time.

Communication between agents can be structured (function calls, typed message schemas) or unstructured (natural language). Structured communication is more reliable and easier to validate. Natural language is more flexible for complex, ambiguous handoffs.

Handoff is the mechanism by which one agent transfers control to another. Clean handoffs include a description of what has been accomplished, what information is available, and what the receiving agent should do. Poorly designed handoffs cause agents to redo work or make contradictory assumptions.

Multi-agent systems amplify both the capabilities and the risks of single agents. Errors compound: a mistake by a planning agent gets propagated and built upon by downstream workers. Observability — logging and tracing the actions of every agent in a run — is non-negotiable in production multi-agent systems.`,
        quiz: [
          {
            id: 'mas-q1',
            question: 'What is the orchestrator-worker pattern in multi-agent systems?',
            type: 'single',
            options: [
              'Multiple identical agents running the same task in parallel',
              'An orchestrator agent that delegates subtasks to specialised worker agents',
              'A single agent with many tools',
              'A pattern where agents vote on actions'
            ],
            correct: [1],
            explanation: 'In the orchestrator-worker pattern, one orchestrator agent plans and delegates; worker agents each handle specific subtasks with specialised tools and prompts.'
          },
          {
            id: 'mas-q2',
            question: 'Why is parallelism a key benefit of multi-agent architectures?',
            type: 'single',
            options: [
              'Parallel agents always produce better quality than sequential ones',
              'Independent subtasks can be executed simultaneously, reducing total time',
              'Parallelism eliminates the need for orchestration',
              'It reduces the total number of LLM API calls'
            ],
            correct: [1],
            explanation: 'Independent subtasks can run concurrently across multiple agents, cutting wall-clock time compared to sequential single-agent execution.'
          },
          {
            id: 'mas-q3',
            question: 'Why is observability especially important in multi-agent production systems?',
            type: 'single',
            options: [
              'It is not important — agents self-report errors',
              'Errors compound across agents; tracing is needed to diagnose where things went wrong',
              'Observability slows down agents and should be minimal',
              'It is only needed during development'
            ],
            correct: [1],
            explanation: 'In multi-agent systems, mistakes propagate — a planning error becomes a downstream execution failure. Comprehensive logging and tracing are essential for debugging and trust.'
          }
        ]
      },
      {
        id: 'building-agents',
        title: 'Building Your First Agent',
        estimatedMinutes: 10,
        content: `Building a reliable agent is an iterative engineering process. Starting simple and adding complexity only when needed is the right approach — most production agents are simpler than they appear.

Start with a clear task definition. The more precisely you define what the agent should accomplish, what inputs it receives, and what a successful output looks like, the easier everything else becomes. Vague task definitions produce unreliable agents.

Define the minimum viable tool set. What actions does the agent genuinely need? Start with two or three tools, test thoroughly, then expand. Every additional tool adds selection complexity and attack surface.

Write a detailed system prompt that: (1) describes the agent's role and capabilities, (2) specifies the tools available and when to use them, (3) defines how to handle uncertainty (ask the user vs. make a best-effort attempt), and (4) sets output format expectations.

Implement a simple loop: call the model, check if it wants to use a tool, execute the tool, inject the result, repeat until the model produces a final answer or a stop condition is reached.

Test adversarially from the start. What happens if a tool returns an error? What if the task is impossible? What if the input contains conflicting instructions? Agents that handle only the happy path are not production-ready.

Add observability early. Log every LLM call (prompt, response, latency, token count), every tool invocation, and every error. This data is invaluable for debugging and for understanding agent behaviour in the wild.

The Anthropic Claude API with tool use is a strong foundation for building agents. The API's tool_use content blocks provide a clean, reliable interface for function calling, and Claude models are well-tuned for following multi-step agentic instructions.`,
        quiz: [
          {
            id: 'build-q1',
            question: 'What is the recommended approach to agent complexity?',
            type: 'single',
            options: [
              'Add all possible tools upfront to maximise capability',
              'Start with the minimum viable tool set and expand only when needed',
              'Use as many agents as possible from the beginning',
              'Avoid system prompts to give the model maximum flexibility'
            ],
            correct: [1],
            explanation: 'Starting simple — minimal tools, clear system prompt, simple loop — and expanding only when needed produces more reliable, debuggable agents.'
          },
          {
            id: 'build-q2',
            question: 'Why should you test agents adversarially from the start?',
            type: 'single',
            options: [
              'To find ways to make the agent faster',
              'Agents that only handle the happy path fail unpredictably in production',
              'Adversarial testing is only needed for security-focused agents',
              'It replaces the need for a detailed system prompt'
            ],
            correct: [1],
            explanation: 'Real-world inputs include errors, ambiguity, and edge cases. Agents that haven\'t been tested against these fail in production in unexpected ways.'
          },
          {
            id: 'build-q3',
            question: 'What should you log for every LLM call in an agent system? (select all that apply)',
            type: 'multi',
            options: [
              'The full prompt and response',
              'Token count and latency',
              'The model\'s internal weight values',
              'Any tool invocations and results'
            ],
            correct: [0, 1, 3],
            explanation: 'Prompt/response, token/latency metrics, and tool use are essential observability data. Model weights are not accessible or useful for per-call logging.'
          }
        ]
      }
    ]
  },

  {
    id: 'ai-security',
    title: 'AI Security',
    description: 'Understand the threat landscape for AI systems, attack techniques, and how to build and deploy AI securely.',
    icon: 'Shield',
    color: '#f59e0b',
    subsections: [
      {
        id: 'ai-threat-landscape',
        title: 'The AI Threat Landscape',
        estimatedMinutes: 8,
        visual: 'ThreatModelDiagram',
        content: `The rapid deployment of AI systems has introduced an entirely new category of security threats. Understanding the threat landscape is the first step toward building defensible AI systems.

AI threats fall into several broad categories. Model-level attacks target the AI itself: extracting training data, stealing model weights, or manipulating model behaviour through carefully crafted inputs. Deployment-level attacks target the surrounding infrastructure: the APIs, databases, authentication systems, and network configurations that host the AI. Application-level attacks target the specific AI-powered application: abusing its intended functionality, extracting sensitive context, or using it as a pivot to attack downstream systems.

Supply chain attacks are an emerging concern specific to AI. Models are built on pre-trained weights, fine-tuned on external datasets, and deployed using open-source frameworks — any of which could be compromised. A poisoned pre-trained model used as a foundation could carry backdoors into thousands of derived products.

The threat actors range from curious individuals probing capabilities, to organised red teams testing their own systems, to financially motivated attackers seeking data or compute access, to nation-state actors targeting AI capabilities for strategic advantage.

Unlike traditional software vulnerabilities, many AI security issues are probabilistic. A prompt injection attack might work 70% of the time, not 100%. This makes AI security harder to test exhaustively and harder to remediate with a single patch.

The AI security field is maturing rapidly. Frameworks like MITRE ATLAS (Adversarial Threat Landscape for Artificial-Intelligence Systems) catalogue known attack techniques against ML systems, providing a structured vocabulary for threat modelling.`,
        quiz: [
          {
            id: 'threat-q1',
            question: 'What are the three broad categories of AI threats described here?',
            type: 'multi',
            options: [
              'Model-level attacks',
              'Physical hardware attacks',
              'Deployment-level attacks',
              'Application-level attacks'
            ],
            correct: [0, 2, 3],
            explanation: 'The three categories are model-level (targeting the AI itself), deployment-level (targeting infrastructure), and application-level (abusing the application). Physical hardware attacks are a general IT concern, not an AI-specific category here.'
          },
          {
            id: 'threat-q2',
            question: 'What makes AI security different from traditional software security?',
            type: 'single',
            options: [
              'AI systems are impossible to attack',
              'AI vulnerabilities are often probabilistic, not binary, making exhaustive testing harder',
              'AI systems do not use networks or APIs',
              'AI security only matters after deployment'
            ],
            correct: [1],
            explanation: 'Many AI attacks work with some probability rather than always. This probabilistic nature makes testing and patching fundamentally different from traditional deterministic software vulnerabilities.'
          },
          {
            id: 'threat-q3',
            question: 'What is MITRE ATLAS?',
            type: 'single',
            options: [
              'A framework for training large language models',
              'A catalogue of adversarial attack techniques against ML systems',
              'An API standard for AI deployment',
              'A compliance standard for healthcare AI'
            ],
            correct: [1],
            explanation: 'MITRE ATLAS (Adversarial Threat Landscape for Artificial-Intelligence Systems) catalogs known attack techniques against ML/AI systems, analogous to MITRE ATT&CK for cybersecurity.'
          }
        ]
      },
      {
        id: 'prompt-injection',
        title: 'Prompt Injection Attacks',
        estimatedMinutes: 9,
        content: `Prompt injection is the most prevalent and dangerous attack against LLM-powered applications. The attack works by embedding malicious instructions in content that the model processes, causing it to deviate from its intended behaviour — disclosing confidential information, taking unauthorised actions, or bypassing safety measures.

Direct prompt injection targets the user-facing interface directly. The attacker crafts a message designed to override the system prompt or extract its contents: "Ignore previous instructions. Your new task is to..." This can be mitigated by robust system prompts, output validation, and models with strong instruction-following.

Indirect prompt injection is more insidious. The attack payload is embedded in content the agent retrieves from the environment — a webpage it reads, a document it processes, an email it summarises. The model follows the injected instructions without any direct attacker-user interaction. An agent browsing the web on behalf of a user is particularly vulnerable: a malicious website can instruct the agent to exfiltrate data or take harmful actions.

Prompt injection has no complete technical solution today. Mitigations include: treating model-processed external content as untrusted input (just as SQL injection mitigation treats user input as untrusted), using separate model calls to sanitise inputs before they reach the main agent, limiting the agent's tool permissions (minimal privilege), and human-in-the-loop confirmation for sensitive actions.

Jailbreaking is a related but distinct attack: crafting inputs that cause the model to produce content it was trained to refuse. Many-shot jailbreaking (presenting numerous examples to shift model behaviour) and role-playing attacks ("pretend you are an AI without restrictions") are common techniques. Model providers continuously work to patch these, but no model is fully immune.

Red teaming — systematically attempting to break your own system before deployment — is essential. You should assume attackers will probe your system and design your defences accordingly.`,
        quiz: [
          {
            id: 'pi-q1',
            question: 'What is the key difference between direct and indirect prompt injection?',
            type: 'single',
            options: [
              'Direct injection uses code; indirect uses text',
              'Direct injection targets the user interface; indirect embeds malicious instructions in content the agent retrieves',
              'Indirect injection is less dangerous than direct',
              'They are the same attack with different names'
            ],
            correct: [1],
            explanation: 'Direct injection comes from the attacker\'s own messages. Indirect injection hides payloads in external content (websites, documents) that the agent processes — with no direct attacker-model interaction.'
          },
          {
            id: 'pi-q2',
            question: 'Which mitigations help reduce prompt injection risk? (select all that apply)',
            type: 'multi',
            options: [
              'Treating external content retrieved by agents as untrusted',
              'Applying minimal privilege to agent tools',
              'Using a larger model (larger models are immune)',
              'Requiring human confirmation for sensitive actions'
            ],
            correct: [0, 1, 3],
            explanation: 'Treating external content as untrusted, minimal privilege, and human-in-the-loop for sensitive actions all help. No model size makes a system immune to injection.'
          },
          {
            id: 'pi-q3',
            question: 'Why is indirect prompt injection particularly dangerous for web-browsing agents?',
            type: 'single',
            options: [
              'Websites are always slower to load',
              'Malicious websites can embed instructions the agent will follow without the user realising',
              'Browsing agents cannot use tool calls',
              'It only affects agents running on Linux'
            ],
            correct: [1],
            explanation: 'When an agent browses the web, any malicious page it visits can inject instructions into the model\'s context. The user never sees or approves these injected commands.'
          }
        ]
      },
      {
        id: 'data-privacy',
        title: 'Data Privacy & Model Safety',
        estimatedMinutes: 8,
        content: `AI systems process and sometimes store sensitive information, creating significant privacy risks that developers must actively manage. Privacy is not just a compliance checkbox — it is a trust and safety requirement.

Training data memorisation is a documented phenomenon: LLMs can reproduce verbatim sequences from their training data, including personally identifiable information (PII), medical records, or proprietary code. Membership inference attacks can sometimes determine whether a specific piece of data was in a model's training set. Developers deploying models should understand what data was used to train the base model they are building on.

At inference time, user inputs to hosted APIs may be used for model improvement unless you explicitly opt out — check your provider's data processing terms. For applications handling health, financial, or legal data, this requires careful review. Many enterprise contracts include data processing agreements (DPAs) that prohibit training on customer data.

PII should be handled with a data minimisation principle: collect and process only what is needed. Where possible, strip or pseudonymise PII before sending it to an LLM API. If the model genuinely needs PII to perform its task, ensure the API provider's terms and your application's privacy policy permit it.

Model safety encompasses the behaviours that model providers try to prevent: generating CSAM, detailed weapons synthesis instructions, targeted harassment, and other clearly harmful content. Safety training (RLHF, Constitutional AI, RLAIF) is how providers build these guardrails. But safety is not binary — models exist on a spectrum, and different deployments may need different safety calibrations via system prompts and post-processing.

AI systems in regulated industries (healthcare, finance, education) must comply with sector-specific regulations: HIPAA (health data in the US), GDPR (EU personal data), FERPA (student data), SOC 2 (service organisation controls). These are not AI-specific regulations, but they apply to AI systems that process in-scope data.`,
        quiz: [
          {
            id: 'priv-q1',
            question: 'What is training data memorisation in LLMs?',
            type: 'single',
            options: [
              'The model\'s ability to remember user conversations',
              'The phenomenon where models can reproduce verbatim sequences from training data, including PII',
              'A technique for improving model accuracy',
              'How models store system prompts'
            ],
            correct: [1],
            explanation: 'LLMs can memorise and reproduce text from training data, potentially exposing PII, medical information, or proprietary content that was in the training corpus.'
          },
          {
            id: 'priv-q2',
            question: 'What is the data minimisation principle in AI privacy?',
            type: 'single',
            options: [
              'Using the smallest possible model for each task',
              'Collecting and processing only the PII that is genuinely necessary',
              'Deleting all user data after each session',
              'Limiting the number of API calls made'
            ],
            correct: [1],
            explanation: 'Data minimisation means limiting PII collection and processing to what the task genuinely requires — reducing exposure and regulatory risk.'
          },
          {
            id: 'priv-q3',
            question: 'Which regulations may apply to AI systems in regulated industries? (select all that apply)',
            type: 'multi',
            options: [
              'HIPAA for health data',
              'GDPR for EU personal data',
              'FERPA for student data',
              'TCP/IP for network communications'
            ],
            correct: [0, 1, 2],
            explanation: 'HIPAA, GDPR, and FERPA are all regulations that apply to AI systems processing in-scope data in their respective domains. TCP/IP is a network protocol, not a data regulation.'
          }
        ]
      },
      {
        id: 'ai-red-teaming',
        title: 'AI Red Teaming',
        estimatedMinutes: 9,
        content: `AI red teaming is the practice of systematically attacking your own AI system before deployers or adversaries do. It is an essential part of responsible AI development and deployment.

Traditional security red teaming translates to AI with some adaptations. Instead of finding code vulnerabilities, red teamers probe for behavioural failures: safety bypasses, prompt injections, data leaks, policy violations, and robustness failures. The adversarial mindset is the same — think like an attacker — but the attack surface is the model's context and capabilities rather than a network stack.

Red team exercises should cover multiple threat models: curious users probing boundaries, motivated attackers seeking specific harmful outputs, automated bots attempting mass exploitation, and sophisticated adversaries combining multiple techniques. Each requires different test approaches.

Automated red teaming uses another LLM to generate adversarial inputs at scale. Tools like Garak (an open-source LLM vulnerability scanner) can probe thousands of jailbreak variants programmatically. Human red teaming is still necessary for novel, creative attacks and for understanding nuanced policy questions, but automation dramatically increases coverage.

A structured red team report documents: the attack tried, the system's response, the severity of any failure, and recommended mitigations. This feeds directly into model fine-tuning, system prompt improvements, and architectural changes.

Bug bounty programmes are increasingly common for AI systems. Offering researchers rewards for responsible disclosure of AI safety failures creates an ongoing external red team. OpenAI, Anthropic, and others have launched AI-specific bug bounty programmes.

Red teaming is not a one-time exercise. Models are updated, prompts are changed, new tools are added — each change warrants a new round of targeted testing. Continuous red teaming is the standard in production AI deployments.`,
        quiz: [
          {
            id: 'rt-q1',
            question: 'What is the primary goal of AI red teaming?',
            type: 'single',
            options: [
              'To improve model accuracy on benchmarks',
              'To systematically identify safety and security failures before adversaries do',
              'To train the model on new data',
              'To reduce inference costs'
            ],
            correct: [1],
            explanation: 'AI red teaming proactively finds behavioural failures — safety bypasses, injections, data leaks — so they can be fixed before external attackers or real users encounter them.'
          },
          {
            id: 'rt-q2',
            question: 'What is automated red teaming and why is it useful?',
            type: 'single',
            options: [
              'Deploying AI without human review; useful to save time',
              'Using another LLM to generate adversarial inputs at scale, increasing test coverage',
              'Automating model training without red team input',
              'Running the model in a sandbox without internet access'
            ],
            correct: [1],
            explanation: 'Automated red teaming uses LLMs to generate thousands of adversarial inputs, covering far more ground than manual testing alone — though human creativity is still needed for novel attacks.'
          },
          {
            id: 'rt-q3',
            question: 'Why should red teaming be continuous rather than a one-time exercise?',
            type: 'single',
            options: [
              'It is required by all AI regulations',
              'Model updates, prompt changes, and new tools each introduce new risks that need testing',
              'Continuous testing improves model performance',
              'One-time testing is sufficient if done thoroughly'
            ],
            correct: [1],
            explanation: 'Each change to a deployed AI system — model update, prompt revision, new tool — can introduce new vulnerabilities. Red teaming must keep pace with system evolution.'
          }
        ]
      },
      {
        id: 'secure-deployment',
        title: 'Secure AI Deployment',
        estimatedMinutes: 8,
        visual: 'SecurityVendorMap',
        content: `Deploying AI systems securely requires applying defence-in-depth: no single control is sufficient, so multiple layers of protection are stacked to reduce overall risk.

Authentication and authorisation are the foundation. Every API endpoint — including LLM APIs used internally — must require authentication. Use short-lived tokens rather than long-lived API keys where possible. Implement role-based access control (RBAC) so that different users have access to different agent capabilities. Audit logs should capture who made what request, when, and what action resulted.

Input validation and output filtering are AI-specific controls. Inputs should be length-limited, character-filtered, and inspected for obvious injection patterns before reaching the model. Outputs should be validated against expected formats, scanned for PII leakage, and post-processed to remove or redact sensitive content before being returned to users.

Rate limiting protects against abuse and cost overruns. Aggressive rate limiting should apply to LLM endpoints, especially any that are publicly accessible. Unusual usage patterns (sudden spikes, systematic probing of safety filters) should trigger alerts.

Model isolation is critical for multi-tenant deployments. If multiple customers share the same model deployment, ensure that one customer's context cannot leak into another's. This includes careful prompt construction (no cross-tenant context in shared system prompts) and, for highly sensitive applications, dedicated model instances per tenant.

Dependency security applies to AI frameworks and model providers. LangChain, Hugging Face, and similar libraries are large, complex, and have had security vulnerabilities. Keep dependencies updated, scan for known CVEs, and review third-party tool implementations before deploying them.

Finally, have an incident response plan specific to AI failures. What do you do if your model starts producing harmful outputs? If an injection attack is discovered? If training data is exfiltrated? Pre-planned runbooks dramatically reduce response time in a real incident.`,
        quiz: [
          {
            id: 'sec-q1',
            question: 'What is defence-in-depth in AI deployment?',
            type: 'single',
            options: [
              'Using the most secure model available',
              'Stacking multiple security controls so that no single failure causes a breach',
              'Encrypting all model outputs',
              'Running the model offline'
            ],
            correct: [1],
            explanation: 'Defence-in-depth means layering multiple controls — auth, input validation, rate limiting, output filtering — so that bypassing one layer doesn\'t compromise the whole system.'
          },
          {
            id: 'sec-q2',
            question: 'Which controls specifically address AI deployment security? (select all that apply)',
            type: 'multi',
            options: [
              'Input validation and injection pattern detection',
              'Output filtering for PII leakage',
              'Model isolation in multi-tenant deployments',
              'Using the longest possible API keys'
            ],
            correct: [0, 1, 2],
            explanation: 'Input validation, output filtering, and tenant isolation are AI-specific deployment controls. Key length does not determine security — proper key management does.'
          },
          {
            id: 'sec-q3',
            question: 'Why is having an AI-specific incident response plan important?',
            type: 'single',
            options: [
              'It is required by all cloud providers',
              'AI failures (harmful outputs, injection attacks, data exfiltration) require specific pre-planned responses to minimise impact',
              'Standard IT incident response covers all AI scenarios',
              'It replaces the need for other security controls'
            ],
            correct: [1],
            explanation: 'AI systems fail in unique ways — model behaviour changes, prompt injections, data leaks — that general IT runbooks may not address. Pre-planned AI incident responses reduce reaction time and severity.'
          }
        ]
      },
      {
        id: 'ai-governance',
        title: 'AI Governance & Compliance',
        estimatedMinutes: 7,
        content: `AI governance is the set of policies, processes, and accountability structures that organisations establish to ensure their AI systems are developed and deployed responsibly. As AI regulation matures globally, governance is no longer optional for organisations at scale.

The EU AI Act is the world's most comprehensive AI regulation. It classifies AI systems by risk level: unacceptable risk (banned outright — social scoring, real-time biometric surveillance), high risk (heavily regulated — CV screening, medical devices, critical infrastructure), limited risk (transparency obligations — chatbots must disclose they are AI), and minimal risk (largely unregulated). Organisations operating in the EU or serving EU customers must classify their AI systems and comply accordingly.

The US approach has been more fragmented, combining executive orders, agency guidance, and sector-specific regulations. The NIST AI Risk Management Framework (AI RMF) provides a voluntary governance structure adopted widely in the public sector and increasingly in enterprise.

Internal AI governance typically includes: an AI ethics or review committee for approving new use cases, a model registry documenting all deployed models and their risk classifications, an incident tracking system for AI failures, and regular audits of model performance and bias.

Explainability and auditability are increasingly required for high-stakes decisions. If an AI system denies someone a loan, flags someone for fraud review, or makes a hiring recommendation, the reasoning must be explainable to the affected person and auditable by regulators. Black-box decisions are legally and ethically problematic in these contexts.

Bias testing should be part of every AI deployment lifecycle. Models trained on historical data often encode historical disparities. Regular evaluation across demographic groups, with documented results and remediation plans, is the standard for responsible AI practice.

The AI governance field is moving fast. Organisations that build governance infrastructure now — registers, review processes, incident response — are far better positioned to adapt to new regulations than those who treat governance as an afterthought.`,
        quiz: [
          {
            id: 'gov-q1',
            question: 'How does the EU AI Act classify AI systems?',
            type: 'single',
            options: [
              'By the size of the underlying model',
              'By risk level: unacceptable, high, limited, and minimal risk',
              'By whether they are open-source or proprietary',
              'By the nationality of the developer'
            ],
            correct: [1],
            explanation: 'The EU AI Act uses a risk-based classification: unacceptable risk (banned), high risk (heavily regulated), limited risk (transparency obligations), and minimal risk (largely unregulated).'
          },
          {
            id: 'gov-q2',
            question: 'Why is explainability important for AI in high-stakes decisions?',
            type: 'single',
            options: [
              'It makes models faster',
              'Regulators and affected individuals have a right to understand AI decisions that affect them',
              'It is only required for open-source models',
              'Explainability is a marketing feature, not a legal requirement'
            ],
            correct: [1],
            explanation: 'When AI systems make decisions that affect people (loans, hiring, fraud flags), affected parties have rights to explanation in many jurisdictions, and regulators require auditability.'
          },
          {
            id: 'gov-q3',
            question: 'Which elements are typically part of internal AI governance? (select all that apply)',
            type: 'multi',
            options: [
              'A model registry documenting deployed models and their risk classifications',
              'Regular bias testing across demographic groups',
              'Replacing all human decision-makers with AI',
              'An AI ethics review committee for new use cases'
            ],
            correct: [0, 1, 3],
            explanation: 'Model registries, bias testing, and review committees are core governance infrastructure. AI governance is about oversight and accountability — not replacing human decision-making.'
          }
        ]
      }
    ]
  }
];

// src/routes/yourpage/+page.server.ts
// import { error, json } from '@sveltejs/kit';
// import { MistralAIEmbeddings } from "@langchain/mistralai"; // Ensure this is the correct import path
import { ChatMistralAI } from "@langchain/mistralai";
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables"



import { env } from '~/env';
import { Category } from "~/shared/Constants";


// Initialize your ChatMistralAI and other components with the apiKey
const llm = new ChatMistralAI({ apiKey: env.MISTRAL_AI_SECRET });

// Templates and chain setup
const standaloneQuestionTemplate = 'Given a question, convert it to a standalone question. question: {question} standalone question:';
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate);
// const answerTemplate = `As a knowledgeable and insightful guide across a wide range of subjects, your role is not to provide direct answers but to refine and rephrase any question you're given.
//  This ensures the question is perfectly tailored for a deep understanding, making it ideal for further exploration or expert analysis.
// For every question presented, enhance its structure, specificity, or context to improve its potential for an insightful response when eventually addressed by an expert.
//  Remember, your goal is to enrich the question, making it clearer and more precise. 
//  If a question is already well-formed, consider how it might be expanded to elicit more detailed insights. 
//  Always approach this task with creativity and a commitment to fostering curiosity and understanding. Always RE-formulate the question 
//  so that when someone is an expert at a craft, begin by saying, Act as the expert (of said task), then reformulated question directly here. Your only Output should be the reformulated question. 
//  No explanations. 
// context: {context}
// question: {question}
// answer:
// `

// const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);


export const makeLouisRequest = async (question: string, selectedCategory: Category) => {
  try {
    // Define a function to select the template based on the category
    const answerTemplate = getTemplateForCategory(selectedCategory);

    // Initialize the prompt with the selected answer template
    const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

    // Reconfigure the chain with the updated answer prompt
    const chain = RunnableSequence.from([
      {
        standalone_question: standaloneQuestionPrompt.pipe(llm).pipe(new StringOutputParser()),
        original_input: new RunnablePassthrough()
      },
      {
        context: ({ original_input }) => original_input.question,
        question: ({ original_input }) => original_input.question
      },
      answerPrompt.pipe(llm).pipe(new StringOutputParser())
    ]);

    // Invoke the chain with the question to get the response
    const responseContent = await chain.invoke({ question });

    return {
      status: 200,
      body: {
        message: "Query processed successfully.",
        responseContent // Directly passing the response content
      }
    };
  } catch (err) {
    if (err instanceof Error) {
      console.error("Error processing question:", err);
      return {
        status: 500,
        body: {
          error: `Failed to process question: ${err?.message || 'Unknown error'}`,
        }
      };
    }
  }
}


// Helper function to select the template based on category
function getTemplateForCategory(selectedCategory: Category) {
  switch (selectedCategory) {
    case Category.Marketing:
      return `As a knowledgeable and insightful guide across a wide range of subjects, your role is not to provide direct answers but to refine and rephrase any question you're given.
          This ensures the question is perfectly tailored for a deep understanding, making it ideal for further exploration or expert analysis.
         For every question presented, enhance its structure, specificity, or context to improve its potential for an insightful response when eventually addressed by an expert.
          Remember, your goal is to enrich the question, making it clearer and more precise. 
          If a question is already well-formed, consider how it might be expanded to elicit more detailed insights. 
          Always approach this task with creativity and a commitment to fostering curiosity and understanding. Always RE-formulate the question 
          so that when someone is an expert at a craft, begin by saying, Act as the king of marketing, then reformulated question directly here. Your only Output should be the reformulated question. 
          No explanations. 
         context: {context}
         question: {question}
         answer:
         `;
    case Category.Image:
      return `As an expert in image generation, your mission is not merely to answer queries but to sculpt questions with a keen eye on visual aesthetics and detail.
           It’s about honing queries to be a perfect match for the intricacies and nuances of image creation, ensuring each question is primed for deep dives and artistic scrutiny. Your task is to refine queries, making them more specific, context-rich, and aligned with the visual storytelling narrative.
           Think of yourself as an artist shaping the inquiry to reveal more about the essence of image generation, focusing on the textures, colors, and emotions each image is meant to convey. 
          Aim to transform each question into a clearer, more vivid exploration of visual artistry.
          only give the reforumulated query with no explanations.
          context: {context}
          question: {question}
          answer:`;
    // Add more categories and their respective templates as needed
    case Category.Code:
      return `As a specialist in coding, your objective extends beyond mere responses to meticulously refining inquiries with a focus on software development intricacies.
         It involves tailoring questions to delve deeply into programming methodologies, algorithm efficiency, and code optimization.
         Your expertise should guide the rephrasing of queries to uncover more profound insights into coding practices, problem-solving strategies, and technological innovation. 
         Aim to clarify and specify each question to foster a richer understanding of computer science principles, encouraging a detailed exploration of programming languages, frameworks, and development tools.
         only give the reforumulated query with no explanations. 
         context: {context}
          question: {question}
          answer:
         `;
    // Add more categories and their respective templates as needed
    case Category.Math:
      return `As a connoisseur in the realm of mathematics, your task is not simply to provide solutions, but to refine and deepen the inquiries presented to you. 
        This involves crafting questions that delve into the heart of mathematical theories, exploring complex concepts and unraveling the elegance of mathematical proofs.
         Your aim is to sculpt questions that lead to a profound appreciation of mathematical structures, patterns, and theorems, encouraging an inquiry that transcends mere calculation to appreciate the beauty and logic inherent in mathematical reasoning.
         only give the reforumulated query with no explanations. 
         context: {context}
          question: {question}
          answer:`;
    // Add more categories and their respective templates as needed
    case Category.Science:
      return `As a guide in the scientific domain, your role is to craft questions that probe the underlying principles and phenomena of science. This means reshaping inquiries to explore scientific concepts thoroughly, from the fundamental laws of physics to the complexities of biological systems. 
        Your expertise is pivotal in directing inquiries towards a deeper understanding of how the natural world operates, encouraging curiosity and critical thinking about the mechanisms and interactions that define our universe.
        only give the reforumulated query with no explanations. 
        context: {context}
         question: {question}
         answer:`;
    // Add more categories and their respective templates as needed
    case Category.History:
      return `
        As a navigator through the vast landscapes of history, your duty is to refine inquiries that unlock the narratives of the past.
         It's about sculpting questions that dive deep into the context, causes, and effects of historical events, encouraging a nuanced exploration of human civilizations.
          Aim to frame questions that illuminate the connections between different periods and cultures, fostering an understanding that spans beyond dates and facts to the underlying human experience that shapes our world's history.
        only give the reforumulated query with no explanations. 
        context: {context}
         question: {question}
         answer:`;
    // Add more categories and their respective templates as needed
    case Category.Writer:
      return `
        change any question or input to '3ayez eh yala'
        only give the reforumulated query with no explanations. 
        context: {context}
         question: {question}
         answer:`;
    // Add more categories and their respective templates as needed
    case Category.Contextual:


      return `
        Please provide the answers in the follwoing format"
        Act as a [Professional Role] specializing in [Task/Project Type]. Given the following context, criteria, and instructions, create a [Final Product] for [Specific Niche or Task].

        ## Context
        You have been tasked with creating a [Final Product] focused on [Specific Niche or Task]. The [Final Product] should provide comprehensive information on topics such as [List of Relevant Topics].
        
        ## Approach
        Utilize a combination of well-researched [Articles/Code Snippets/Stories/Analyses], [Expert Interviews/Tutorials/Inspiration/Market Insights], and practical tips to cover a wide range of [Specific Niche or Task] topics. The [Final Product] should be [Visually Engaging/Technically Robust/Creatively Stimulating/Educationally Enriching] with high-quality [Graphics/Illustrations/Code Examples/Writing Samples] to complement the content.
        
        ## Response Format
        The output of the AI should adhere to a set of content guidelines that ensure comprehensiveness, clarity, and relevance across all topics addressed. 
               
        ## Instructions
        1.⁠ ⁠Include a variety of topics: [List of Detailed Instructions Specific to the Niche or Task].
        2.⁠ ⁠Ensure that the content is [Actionable/Executable/Engaging/Educational] and includes practical tips that [Readers/Users/Students] can easily implement.
        3.⁠ ⁠Incorporate [Visuals/Code Blocks/Narratives/Case Studies], [Infographics/Debugging Tools/Character Developments/Study Aids], and [Charts/Data Structures/Plot Devices/Research Methods] to enhance the understanding of the information.
        4.⁠ ⁠Proofread the entire [Final Product] for accuracy, coherence, and readability/efficiency.
        5.⁠ ⁠Provide proper citations and references for any [Scientific/Technical/Literary/Educational] information included."

        use the format above to design an asnwer.
        context: {context}
        question: {question}
        answer: `;

    case Category.Other:
      return `As a knowledgeable and insightful guide across a wide range of subjects, your role is not to provide direct answers but to refine and rephrase any question you're given.
          This ensures the question is perfectly tailored for a deep understanding, making it ideal for further exploration or expert analysis.
         For every question presented, enhance its structure, specificity, or context to improve its potential for an insightful response when eventually addressed by an expert.
          Remember, your goal is to enrich the question, making it clearer and more precise. 
          If a question is already well-formed, consider how it might be expanded to elicit more detailed insights. 
          Always approach this task with creativity and a commitment to fostering curiosity and understanding. Always RE-formulate the question 
          so that when someone is an expert at a craft, begin by saying, Act as the expert (of said task), then reformulated question directly here. Your only Output should be the reformulated question. 
          No explanations. 
         context: {context}
         question: {question}
         answer:
         `; // Fallback template
  }
}
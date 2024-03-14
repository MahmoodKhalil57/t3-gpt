import { createRef, type KeyboardEvent, type MouseEvent } from "react";
import Message from "./Message";
import { Category, DEFAULT_OPENAI_MODEL } from "~/shared/Constants";
import { type Signal, computed, signal, effect } from "@preact/signals-react";
import { client } from "~/trpc/react";

const isLoading = signal(false)

const message = signal("")
const messageEmpty = computed(() => message.value.length === 0)

const errorMessage = signal("")
const errorMessageContainer = computed(() => errorMessage.value ? (
  <div className="mb-2 md:mb-0">
    <div className="h-full flex ml-1 md:w-full md:m-auto md:mb-2 gap-0 md:gap-2 justify-center">
      <span className="text-red-500 text-sm">{errorMessage}</span>
    </div>
  </div>
) : null)

const showEmptyChat = signal(true)

const conversation = signal<{ content: string | null, role: "user" | "system" }[]>([])
const conversationEmpty = computed(() => conversation.value.length === 0)
const conversationMessages = computed(() => conversation.value.map((message, index) => (
  <Message key={index} message={message} />
)))

const conversationContainer = computed(() => !showEmptyChat.value && !conversationEmpty.value ? (
  <div className="flex flex-col items-center text-sm bg-gray-800">
    <div className="flex w-full items-center justify-center gap-1 border-b border-black/10 bg-gray-50 p-3 text-gray-500 dark:border-gray-900/50 dark:bg-gray-700 dark:text-gray-300">
      Model: {selectedModel.name}
    </div>
    {conversationMessages}
    <div className="w-full h-32 md:h-48 flex-shrink-0"></div>
    <div ref={bottomOfChatRef}></div>
  </div>
) : (<div className="py-10 relative w-full flex flex-col h-full">
  <div className="flex items-center justify-center gap-2">
    <div className="relative w-full md:w-1/2 lg:w-1/3 xl:w-1/4">
      <button
        className="relative flex w-full cursor-default flex-col rounded-md border border-black/10 bg-white py-2 pl-3 pr-10 text-left focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:border-white/20 dark:bg-gray-800 sm:text-sm align-center"
        id="headlessui-listbox-button-:r0:"
        type="button"
        aria-haspopup="true"
        aria-expanded="false"
        data-headlessui-state=""
        aria-labelledby="headlessui-listbox-label-:r1: headlessui-listbox-button-:r0:"
      >
        <label
          className="block text-xs text-gray-700 dark:text-gray-500 text-center"
          id="headlessui-listbox-label-:r1:"
          data-headlessui-state=""
        >
          Model
        </label>
        <span className="inline-flex w-full truncate">
          <span className="flex h-6 items-center gap-1 truncate text-white">
            {selectedModel.name}
          </span>
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <div className="i-bi-chevron-down h-4 w-4 text-gray-400"></div>
        </span>
      </button>
    </div>
  </div>
  <h1 className="text-2xl sm:text-4xl font-semibold text-center text-gray-200 dark:text-gray-600 flex gap-2 items-center justify-center h-screen">
    ChatGPT Clone
  </h1>
</div>))

const sendMessageButton = computed(() => <button
  disabled={isLoading.value || messageEmpty.value}
  onClick={sendMessage}
  className="absolute p-1 rounded-md bottom-1.5 md:bottom-2.5 bg-transparent disabled:bg-gray-500 right-1 md:right-2 disabled:opacity-40"
>
  <div className="i-material-symbols-send-rounded h-4 w-4 mr-1 text-white"></div>
</button>)

const selectedModel = DEFAULT_OPENAI_MODEL;

const sendMessage = async (e: KeyboardEvent<HTMLTextAreaElement> | MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
  e.preventDefault();
  const selectedCategory = Category.Code;

  // Don't send empty messages
  if (messageEmpty.value) {
    errorMessage.value = "Please enter a message."
    return;
  } else {
    errorMessage.value = ""
  }

  // trackEvent("send.message", { message: message });
  isLoading.value = true

  // Add the message to the conversation
  conversation.value = [
    ...conversation.value,
    { content: message.value, role: "user" },
  ]

  // Clear the message & remove empty chat
  message.value = ""
  showEmptyChat.value = false

  try {
    const response = await client.openai.sendMessage.mutate({
      messages: conversation.value,
      model: selectedModel,
      selectedCategory,
    })

    if (response?.message) {
      // Add the message to the conversation
      conversation.value = [
        ...conversation.value,
        { content: response?.message ?? '', role: "system" },
      ]
    }


    isLoading.value = false
  } catch (error) {
    const errors = JSON.parse((error as { message: string })?.message ?? '') as { message: string }[] | undefined;
    (errors)?.forEach(error => {
      console.log(error.message);
      errorMessage.value = error.message
    });
  }
}

const bottomOfChatRef = createRef<HTMLDivElement>();
const textAreaRef = createRef<HTMLTextAreaElement>();


effect(() => {
  message.value
  if (textAreaRef.current) {
    textAreaRef.current.style.height = "24px";
    textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
  }
});

effect(() => {
  conversation.value
  if (bottomOfChatRef.current) {
    bottomOfChatRef.current.scrollIntoView({ behavior: "smooth" });
  }
});

const handleKeypress = async (e: KeyboardEvent<HTMLTextAreaElement>) => {
  // It's triggers by pressing the enter key
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    await sendMessage(e);
  }
};

const textArea = computed(() => (<textarea
  ref={textAreaRef}
  tabIndex={0}
  data-id="root"
  style={{
    height: "24px",
    maxHeight: "200px",
    overflowY: "hidden",
  }}
  // rows={1}
  placeholder="Send a message..."
  className="m-0 w-full resize-none border-0 bg-transparent p-0 pr-7 focus:ring-0 focus-visible:ring-0 dark:bg-transparent pl-2 md:pl-0"
  onKeyDown={handleKeypress}
  value={message.value}
  onInput={(event) => (message.value = event.currentTarget.value)}
></textarea>))


const Chat = (props: { mobileSidebarVisible: Signal<boolean> }) => {
  console.log("chat rerendered")
  const { mobileSidebarVisible } = props;

  // const { trackEvent } = useAnalytics();



  return (
    <div className="flex max-w-full flex-1 flex-col">
      <div className="sticky top-0 z-10 flex items-center border-b border-white/20 bg-gray-800 pl-1 pt-1 text-gray-200 sm:pl-3 md:hidden">
        <button
          type="button"
          className="-ml-0.5 -mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white dark:hover:text-white"
          onClick={() => { mobileSidebarVisible.value = !mobileSidebarVisible.value }}
        >
          <span className="sr-only">Open sidebar</span>
          <div className="i-radix-icons-hamburger-menu h-6 w-6 text-white"></div>
        </button>
        <h1 className="flex-1 text-center text-base font-normal">New chat</h1>
        <button type="button" className="px-3">
          <div className="i-bi-plus-lg h-6 w-6"></div>
        </button>
      </div>
      <div className="relative h-full w-full transition-width flex flex-col overflow-hidden items-stretch flex-1">
        <div className="flex-1 overflow-hidden">
          <div className="react-scroll-to-bottom--css-ikyem-79elbk h-full dark:bg-gray-800">
            <div className="react-scroll-to-bottom--css-ikyem-1n7m0yu">
              {conversationContainer}
              <div className="flex flex-col items-center text-sm dark:bg-gray-800"></div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full border-t md:border-t-0 dark:border-white/20 md:border-transparent md:dark:border-transparent md:bg-vert-light-gradient bg-white dark:bg-gray-800 md:!bg-transparent dark:md:bg-vert-dark-gradient pt-2">
          <form className="stretch mx-2 flex flex-row gap-3 last:mb-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl">
            <div className="relative flex flex-col h-full flex-1 items-stretch md:flex-col">
              {errorMessageContainer}
              <div className="flex flex-col w-full py-2 flex-grow md:py-3 md:pl-4 relative border border-black/10 bg-white dark:border-gray-900/50 dark:text-white dark:bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]">
                {textArea}
                {sendMessageButton}
              </div>
            </div>
          </form>
          <div className="px-3 pt-2 pb-3 text-center text-xs text-black/50 dark:text-white/50 md:px-4 md:pt-3 md:pb-6">
            <span>
              ChatGPT Clone may produce inaccurate information about people,
              places, or facts.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

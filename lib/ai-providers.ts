export enum ChatProvider {
  OpenAi = "openai",
}

export enum ChatEngine {
  Unknown = 0,

  OpenAiO1 = 1,
  OpenAiO1Mini = 2,

  OpenAiGpt4O = 3,
  OpenAiGpt4OMini = 4,

  OpenAiO3Mini = 5,
}

export namespace ChatEngine {
  export function toString(engine: ChatEngine): string {
    switch (+engine) {
      case ChatEngine.Unknown:
        return "unknown";
        break;

      case ChatEngine.OpenAiO1:
        return "openai/o1";
        break;
      case ChatEngine.OpenAiO1Mini:
        return "openai/o1-mini";
        break;

      case ChatEngine.OpenAiGpt4O:
        return "openai/gpt-4o";
        break;
      case ChatEngine.OpenAiGpt4OMini:
        return "openai/gpt-4o-mini";
        break;

      case ChatEngine.OpenAiO3Mini:
        return "openai/o3-mini";
        break;

      default:
        throw new Error("Invalid ChatEngine type.");
    }
  }
}

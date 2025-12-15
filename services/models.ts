import modelsText from "../models.txt?raw";

export type AvailableModel = {
  id: string;
  label: string;
};

export const parseModelsFile = (text: string): AvailableModel[] => {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith("#"))
    .map((line) => {
      const [idPart, ...rest] = line.split(",");
      const id = (idPart ?? "").trim();
      const label = rest.join(",").trim();
      return { id, label: label || id };
    })
    .filter((m) => m.id.length > 0);
};

export const availableModels: AvailableModel[] = parseModelsFile(modelsText);

export const assertModelListPresent = (): void => {
  if (availableModels.length === 0) {
    throw new Error(
      "No models available. Ensure models.txt exists and contains at least one model id (one per line, optionally with a display name after a comma)."
    );
  }
};

export const isValidModelId = (id: string): boolean => {
  return availableModels.some((m) => m.id === id);
};

export const getModelLabel = (id: string): string => {
  return availableModels.find((m) => m.id === id)?.label ?? id;
};


export type CheckboxFields = {
  disabled?: boolean;
  options: {
    name: string;
    text: string;
    checked: boolean;
  }[];
};

export type FileInputFields = {
  disabled?: boolean;
  accept?: string;
  preview?: boolean;
};

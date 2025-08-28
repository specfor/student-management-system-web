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
  multiple?: boolean;
};

export type SelectionBoxFields = {
  disabled?: boolean;
  value?: string | number | boolean;
  options: {
    text: string;
    value: string | number | boolean;
  }[];
};

export type getFingerprintRegStatusResponse =
  | {
      status: "completed";
      image?: string;
      msg?: string;
    }
  | {
      status: "error" | "ongoing";
      msg: string;
    };

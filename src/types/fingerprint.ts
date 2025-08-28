export type getFingerprintRegStatusResponse =
  | {
      status: "completed";
      image: string;
    }
  | {
      status: "error" | "ongoing";
      msg: string;
    };

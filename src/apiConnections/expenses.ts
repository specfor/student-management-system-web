import {
  sendDeleteRequest,
  sendGetRequest,
  sendJsonPostRequest,
} from "@/utils/requests";

export function getExpenseCateg() {
  return sendGetRequest("/expenses/categs");
}

export function createExpenseCateg(categ: string) {
  return sendJsonPostRequest("/expenses/categs", { categ });
}

export function deleteExpenseCateg(categ: string) {
  return sendDeleteRequest(`/expenses/categs`, { categ });
}

export function getExpenses(
  startIndex = 0,
  limit: number | null = null,
  options?: {
    sort?: {
      by: "name" | "id";
      direction: "asc" | "desc";
    };
  }
) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;
  if (options?.sort) {
    params.sort = options.sort.by;
    params.sort_dir = options.sort.direction;
  }
  return sendGetRequest("/expenses", params);
}

export function createExpense(
  categ: string,
  amount: number,
  description: string,
  month: string
) {
  return sendJsonPostRequest("/expenses", {
    categ,
    amount,
    description,
    month,
  });
}

export function deleteExpense(id: number) {
  return sendDeleteRequest(`/expenses/${id}`);
}

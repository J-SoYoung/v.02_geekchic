//⭕타입 : 날짜형식, phone 데이터형식 구체적으로
interface UserDataType {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  serviceJoinDate: string[];
  phone: string;
  address: string;
  listCarts: number;
  listMessages: string[];
  listPurchases: number;
  listSells: number;
  isAdmin?: boolean;
}

export type { UserDataType };

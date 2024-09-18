import { get, push, ref, remove, set, update } from 'firebase/database';
import { database } from './firebase';
import {
  CommentType,
  MessageResultType,
  MessagesInfoType,
  MessageType,
  SellsItemType,
  UsedProductType,
} from '@/_typesBundle';

export const uploadUsedProducts = async (
  updateUsedProducts: UsedProductType,
) => {
  const { id, createdAt, seller, images, productName, price, quantity } =
    updateUsedProducts;

  const userSnapshot = await get(
    ref(database, `users/${updateUsedProducts.seller._id}`),
  );
  if (userSnapshot.exists()) {
    const userData = userSnapshot.val();
    const updatedListSells = (userData.listSells || 0) + 1;
    const userSellsData = {
      userId: seller._id,
      usedProductId: id,
      uploadDate: createdAt,
      isSales: true, // 판매중(true), 품절(false)
      image: images[0],
      productName,
      price,
      quantity,
      sellsQuantity: 0,
    };

    // 업데이트 목록 : (1)중고제품, (2)유저데이터>판매목록 수량, (3)판매리스트>유저
    try {
      const updates = {
        [`usedProducts/${updateUsedProducts.id}`]: updateUsedProducts,
        [`userSellList/${updateUsedProducts.seller._id}/${updateUsedProducts.id}`]:
          userSellsData,
        [`users/${updateUsedProducts.seller._id}/listSells`]: updatedListSells, // 판매목록 개수 업데이트
      };
      await update(ref(database), updates);
    } catch (error) {
      console.error('중고제품 업로드 에러', error);
    }
  }
};

export const searchUsedProducts = async (
  queryString: string,
): Promise<UsedProductType[]> => {
  try {
    const snapshot = await get(ref(database, `usedProducts`));
    if (snapshot.exists()) {
      const dataArr: UsedProductType[] = Object.values(snapshot.val());
      const filterData = dataArr.filter((data) => {
        return (
          data.productName &&
          data.productName.toLowerCase().includes(queryString.toLowerCase())
        );
      });
      return filterData;
    }
    return [];
  } catch (error) {
    console.error('중고 제품 검색 에러', error);
    return [];
  }
};

export const getUsedProducts = async (): Promise<UsedProductType[]> => {
  try {
    const snapshot = await get(ref(database, `usedProducts`));
    if (snapshot.exists()) {
      const data = Object.values(snapshot.val()) as UsedProductType[];
      const sortedData = data.sort(
        (a, b) =>
          new Date(b.createdAt.join(' ')).getTime() - new Date(a.createdAt.join(' ')).getTime(),
      );
      return sortedData;
    }
    return [];
  } catch (error) {
    console.error('중고 제품 로드 에러', error);
    return [];
  }
};

export const getUsedProductDetail = async (productId: string) => {
  try {
    const snapshot = await get(ref(database, `usedProducts/${productId}`));
    if (snapshot.exists()) return snapshot.val();
  } catch (error) {
    console.error('중고 상세 페이지 데이터 로드 에러', error);
    return {};
  }
};

// ⭕API getAPI 공용 사용하게 추상화하기
// ⭕API 마이페이지 연결된 4개 데이터로드 공용으로 사용 가능할듯.
export const getMyPageInfo = async (userId: string) => {
  try {
    const snapshot = await get(ref(database, `userSellList/${userId}`));
    if (snapshot.exists()) {
      const data = Object.values(snapshot.val()) as SellsItemType[];
      const sortedData = data.sort(
        (a, b) =>
          new Date(b.uploadDate.join(' ')).getTime() - new Date(a.uploadDate.join(' ')).getTime(),
      );
      return sortedData;
    }
    return [];
  } catch (error) {
    console.error('중고 제품 로드 에러', error);
    return [];
  }
};

// UsedComment API
export interface addUsedCommentProps {
  productId: string;
  comment: CommentType;
}
export interface removeUsedCommentProps {
  productId: string;
  commentId: string;
}
export interface EditUsedCommentProps {
  productId: string;
  commentId: string;
  editCommentData: CommentType;
}
export const getUsedComment = async (productId: string) => {
  try {
    const commentsSnapshot = await get(
      ref(database, `usedComments/${productId}`),
    );
    if (commentsSnapshot.exists()) {
      const data = Object.values(commentsSnapshot.val()) as CommentType[];
      const sortedData = data.sort(
        (a, b) =>
          new Date(b.createdAt.join(' ')).getTime() - new Date(a.createdAt.join(' ')).getTime(),
      );
      return sortedData;
    }
    return [];
  } catch (error) {
    console.error('댓글 불러오기 에러', error);
    return [];
  }
};

export const addUsedComment = ({ productId, comment }: addUsedCommentProps) => {
  try {
    const commentRef = ref(database, `usedComments/${productId}`);
    const newCommentRef = push(commentRef);
    return set(newCommentRef, { ...comment, commentId: newCommentRef.key });
  } catch (error) {
    console.error('중고제품 댓글 추가 에러', error);
  }
};

export const removeUsedComment = async ({
  productId,
  commentId,
}: removeUsedCommentProps) => {
  try {
    const commentRef = ref(database, `usedComments/${productId}/${commentId}`);
    return remove(commentRef);
  } catch (error) {
    console.error('중고제품 댓글삭제 에러', error);
  }
};

export const editUsedComment = async ({
  productId,
  commentId,
  editCommentData,
}: EditUsedCommentProps) => {
  try {
    const commentRef = ref(database, `usedComments/${productId}/${commentId}`);
    return await update(commentRef, editCommentData);
  } catch (error) {
    console.error('중고제품 댓글수정 에러', error);
  }
};

// Messages API
interface checkMessageProps {
  buyerId: string;
  productId: string;
}
interface sendMessagesType {
  currentMessages: MessagesInfoType;
  messageId: string;
}
export const addMessagesPage = async (messageData: MessageType) => {
  try {
    const getUserMessageList = async (userId: string) => {
      const snapshot = await get(ref(database, `users/${userId}`));
      if (snapshot.exists()) {
        const userData = snapshot.val();
        return userData.listMessages || [];
      }
      return [];
    };

    // 판매자와 구매자의 기존 메시지 목록 가져오기
    const sellerPrevMessages = await getUserMessageList(messageData.sellerId);
    const buyerPrevMessages = await getUserMessageList(messageData.buyerId);

    // 판매자와 구매자의 메시지에 새 메시지ID 추가
    const sellerUpdatedMessages = [
      ...sellerPrevMessages,
      messageData.messageId,
    ];
    const buyerUpdatedMessages = [...buyerPrevMessages, messageData.messageId];

    const updates = {
      [`usedMessages/${messageData.messageId}`]: { ...messageData },
      [`users/${messageData.sellerId}/listMessages`]: sellerUpdatedMessages,
      [`users/${messageData.buyerId}/listMessages`]: buyerUpdatedMessages,
    };
    console.log('쪽지 페이지 생성 성공');
    await update(ref(database), updates);
  } catch (error) {
    console.error('쪽지 페이지 생성실패', error);
  }
};

export const checkMessage = async ({
  buyerId,
  productId,
}: checkMessageProps) => {
  try {
    // 유저의 messageId가져오기
    const buyerSnapshot = await get(ref(database, `users/${buyerId}`));
    if (!buyerSnapshot.exists()) return null;

    const { listMessages } = buyerSnapshot.val();
    if (!listMessages || listMessages.length === 0) return null;

    // 모든 messageId에서 유저의 messages만 가져와 productId랑 같은지 확인하기
    for (const messageId of listMessages) {
      const messageSnapshot = await get(
        ref(database, `usedMessages/${messageId}`),
      );
      if (messageSnapshot.exists()) {
        const messageData = messageSnapshot.val();

        if (messageData.productId === productId) {
          return messageData;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('이전 메세지 확인 에러', error);
  }
};

export const getMessageList = async (listMessages: string[]) => {
  try {
    let messagesDb = [];
    let messageResults: MessageResultType[] = [];

    // 유저의 메세지 리스트 가져옴
    for (const messageId of listMessages) {
      const messageSnapshot = await get(
        ref(database, `usedMessages/${messageId}`),
      );
      if (messageSnapshot.exists()) messagesDb.push(messageSnapshot.val());
    }

    if (messagesDb.length > 0) {
      for (const messages of messagesDb) {
        const productSnapshot = await get(
          ref(database, `usedProducts/${messages.productId}`),
        );
        if (productSnapshot.exists()) {
          const { productName, price, quantity, seller, images } =
            productSnapshot.val();
          messageResults.push({
            productName,
            productImage: images[0],
            price,
            quantity,
            seller,
            ...messages,
          });
        }
      }
      return messageResults as MessageResultType[];
    }
    return [];
  } catch (error) {
    console.error('메세지 리스트 불러오기 에러', error);
    return [];
  }
};

export const sendMessages = async ({
  currentMessages,
  messageId,
}: sendMessagesType) => {
  try {
    const messageRef = ref(database, `usedMessages/${messageId}/messages`);
    const newMessageRef = push(messageRef);
    return set(newMessageRef, currentMessages);
  } catch (error) {
    console.error('메세지 보내기 에러', error);
  }
};

export const getMessages = async (messageId: string) => {
  try {
    const messagesSnapshot = await get(
      ref(database, `usedMessages/${messageId}/messages`),
    );
    if (messagesSnapshot.exists()) {
      const data = Object.values(messagesSnapshot.val()) as MessagesInfoType[];
      const sortedData = data.sort(
        (a, b) =>
          new Date(b.timestamp.join(' ')).getTime() - new Date(a.timestamp.join(' ')).getTime(),
      );
      return sortedData;
    }
    return [];
  } catch (error) {
    console.error('메세지 불러오기 에러', error);
    return [];
  }
};

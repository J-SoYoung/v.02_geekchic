import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import { Skeleton } from './Skeleton';

import {
  CommentInput,
  CommentsList,
  ErrorPageReload,
  LoadingSpinner,
  UserProfileInfoComp,
} from '@/components';
import { Icon_Chevron_left } from '@/_assets';
import { addMessagesPage, checkMessage, getUsedPageMainInfo } from '@/_apis';
import { userState } from '@/_recoil';
import { MessageType, UsedProductType } from '@/_typesBundle';
import { utcToKoreaTimes } from '@/_utils';

export const UsedProductsDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [loginUser, setLoginUser] = useRecoilState(userState);
  const [previousMessage, setPreviousMessage] = useState<MessageType | null>(
    null,
  );
  const [isLoadingMessage, setIsLoadingMessage] = useState(true);

  const {
    data: usedProduct,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['usedProductDetail', productId],
    queryFn: () =>
      getUsedPageMainInfo<UsedProductType>({
        table: 'usedProducts',
        id: productId as string,
      }),
  });

  const seller = loginUser?._id === usedProduct?.seller._id;
  const isSoldOut = usedProduct && usedProduct.quantity < 1;

  useEffect(() => {
    const checkPreviousMessage = async () => {
      const result = await checkMessage({
        buyerId: loginUser._id,
        productId: productId as string,
      });
      if (result !== null) setPreviousMessage(result);
      setIsLoadingMessage(false);
    };
    checkPreviousMessage();
  }, []);

  const onClickAddMessagePage = async () => {
    const messageId = uuidv4();
    if (usedProduct) {
      if (previousMessage === null) {
        const messageData = {
          messageId: messageId,
          productId: productId as string,
          sellerId: usedProduct?.seller._id as string,
          buyerId: loginUser._id,
          createdAt: utcToKoreaTimes(),
          salesStatus: 'initialized',
        };
        await addMessagesPage(messageData, loginUser, setLoginUser);
      }
      navigate(
        `/message/send/${previousMessage !== null ? previousMessage.messageId : messageId}`,
        {
          state: {
            buyerId: loginUser._id,
            createdAt: utcToKoreaTimes(),
            messageId:
              previousMessage !== null ? previousMessage.messageId : messageId,
            price: usedProduct.price,
            productId: usedProduct.id,
            productImage: usedProduct.images[0],
            productName: usedProduct.productName,
            quantity: usedProduct.quantity,
            sellerId: usedProduct.seller._id,
            sellerName: usedProduct.seller.username,
          },
        },
      );
    }
  };

  if (isPending) {
    return <Skeleton />;
  }

  if (isError)
    return (
      <ErrorPageReload
        content='데이터를 가져오는 동안 문제가 발생했습니다'
        pageName={'중고 상세'}
        linkTo={'/used'}
        movePage='중고 메인 페이지'
      />
    );

  return (
    <main className='text-left'>
      <button
        className='w-10 h-10 fixed top-2 cursor-pointer'
        onClick={() => navigate(-1)}
      >
        <img src={Icon_Chevron_left} alt='이전 페이지로' className='w-full' />
      </button>
      {usedProduct === null ? (
        <p>데이터가 없습니다. 메인으로 이동합니다</p>
      ) : (
        <>
          {/* image view*/}
          <section>
            <div className='w-full h-[100%]'>
              <div className='mb-6 bg-gray-200 border-red-400'>
                <img
                  src={usedProduct.images[0]}
                  alt={usedProduct.productName}
                  className='w-[100%] h-96 object-cover'
                />
              </div>
              <div className='flex space-x-4 pl-8'>
                {usedProduct.images.map((i: string, idx: number) => (
                  <div
                    key={idx}
                    className='w-24 h-24 flex items-center justify-center'
                  >
                    <img src={i} className='w-full h-full object-cover' />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className='py-8 mx-8 flex justify-between items-center border-b '>
            <UserProfileInfoComp
              avatar={usedProduct.seller.avatar}
              username={usedProduct.seller.username}
              address={usedProduct.seller.address}
            />
            {isSoldOut ? (
              <button className='text-red-500'>품절입니다</button>
            ) : seller ? (
              <button onClick={() => navigate(`/used/edit/${productId}`)}>
                수정하기
              </button>
            ) : !isLoadingMessage ? (
              <button onClick={onClickAddMessagePage} className='p-2 border'>
                {previousMessage === null ? '쪽지보내기' : '쪽지 이어하기'}
              </button>
            ) : (
              <LoadingSpinner size='4' />
            )}
          </section>

          {/* used products item */}
          <article className='p-8 pb-24'>
            <section className=' border-b'>
              <div className='text-xl font-bold'>{usedProduct.productName}</div>
              <div className='text-sm text-gray-500'>
                {usedProduct.createdAt[0]}
              </div>
              <div className='text-xl font-bold mt-2'>
                {usedProduct.price.toLocaleString()}원
              </div>
              <div className='flex space-x-2 mt-2'>
                <span className='px-2 py-1 bg-gray-200 rounded-full text-s'>
                  {usedProduct.deliveryCharge === 'include'
                    ? '배송비 포함'
                    : '배송비 비포함'}
                </span>
                <span className='px-2 py-1 bg-gray-200 rounded-full text-s'>
                  {usedProduct.conditions === 'new' ? '새상품' : '중고상품'}
                </span>
              </div>
              <div className='py-8'>{usedProduct.description}</div>
            </section>

            <CommentsList
              url={`usedComments/${productId}`}
              queryKeys={'usedComments'}
            />
            <CommentInput
              url={`usedComments/${productId}`}
              queryKeys={'usedComments'}
            />
          </article>
        </>
      )}
    </main>
  );
};

import { Link } from 'react-router-dom';
import { SellerMark } from './SellerMark';

interface UsedProductCardProps {
  url?: string;
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  isSoldOut: boolean;
  showSellerInfo?: boolean; // 판매목록에서는 판매량 정보 보여주기
  sellerId?: string;
  sellsQuantity?: number; // 판매 수량 (판매목록에서 사용)
  buyerInfo?: {
    // 구매자정보
    address: string;
    buyerId: string;
    phone: string;
    email: string;
    username: string;
  }[];
}

// ⭕컴포넌트 나누기 : object-cover 이미지 검색되는 것 avatar, user, 정보
export const UsedProductCard = ({
  url,
  id,
  name,
  price,
  image,
  quantity,
  isSoldOut,
  showSellerInfo = false,
  sellsQuantity,
  sellerId,
  buyerInfo,
}: UsedProductCardProps) => {
  console.log(url)
  // /used/detail/:productId  //// /products/detail/:productId
  return (
    <section>
      <Link
        to={ `/${url? url : 'used'}/detail/${id}`}
        className={`relative rounded-lg cursor-pointer ${isSoldOut && 'opacity-50'} `}
      >
        {image ? (
          <img
            className='w-full h-48 object-cover rounded-md mb-2'
            src={image}
            alt={name}
          />
        ) : (
          <img
            src='/default-image.png'
            className='w-full h-48 object-cover rounded-md mb-2 border'
          />
        )}
        <div className='px-2 relative'>
          {sellerId && <SellerMark sellerId={sellerId} />}
          <div className='flex'>
            <h2 className='text-lg font-bold mr-1'>{name}</h2>
          </div>
          <div className='flex items-center justify-between'>
            <p>{price.toLocaleString()}원</p>
            {isSoldOut ? (
              <p className='text-red-500'>( 품절 )</p>
            ) : showSellerInfo ? (
              <div className='mt-2 text-gray-500'>
                <p>재고: {quantity}개</p>
                <p>판매: {sellsQuantity}개</p>
              </div>
            ) : (
              <p>{`( ${quantity}개 남음 )`}</p>
            )}
          </div>
        </div>
      </Link>
      {buyerInfo && (
        <div className='border'>
          <p>구매자 정보</p>
          <ul>
            {buyerInfo?.map((buyer) => (
              <li key={buyer.buyerId}>{buyer.username}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

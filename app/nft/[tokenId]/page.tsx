import { Metadata } from 'next';

type Props = {
  params: { tokenId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Fetch the NFT data from your contract
  const tokenId = params.tokenId;
  
  // You'll need to fetch the actual NFT data here
  // For now, using placeholder
  const nftImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/nft-image/${tokenId}`;
  
  return {
    title: `Proof of Voice #${tokenId}`,
    description: 'View this Proof of Voice NFT on Base',
    openGraph: {
      title: `Proof of Voice #${tokenId}`,
      description: 'Proof of Voice NFT',
      images: [
        {
          url: nftImageUrl,
          width: 800,
          height: 800,
          alt: `Proof of Voice #${tokenId}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Proof of Voice #${tokenId}`,
      description: 'Proof of Voice NFT',
      images: [nftImageUrl],
    },
  };
}

export default function NFTPage({ params }: Props) {
  // Redirect to echo chamber with the token ID
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.location.href = '/echo-chamber#token-${params.tokenId}'`,
      }}
    />
  );
}
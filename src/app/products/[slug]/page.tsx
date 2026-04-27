import { ProductDetail } from "@/components/product-detail";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  return <ProductDetail slug={slug} />;
}

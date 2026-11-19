import React from 'react';
import ProductListing from '@/components/product/ProductListing/ProductListing';

export default function WatchesPage() {
  return (
    <ProductListing
      department="WATCH"
      title="Haute Horlogerie & Montres de Prestige"
      eyebrow="Département Horlogerie Suisse & Japonaise"
      subtitle="Chronographes automatiques, montres de plongée certifiées et pièces classiques habillées, disponibles avec livraison sécurisée à Douala, Yaoundé et dans tout le Cameroun."
      breadcrumbName="Montres"
    />
  );
}

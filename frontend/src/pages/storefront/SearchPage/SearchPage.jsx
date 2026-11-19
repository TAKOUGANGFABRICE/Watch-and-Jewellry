import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductListing from '@/components/product/ProductListing/ProductListing';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  return (
    <ProductListing
      department="ALL"
      title={query ? `Résultats pour "${query}"` : 'Recherche de Produits'}
      eyebrow="Résultats de Recherche FARÉL"
      subtitle={
        query
          ? `Toutes les montres et créations joaillières correspondant à votre recherche.`
          : `Explorez l'ensemble de notre catalogue en utilisant les filtres ou la barre de recherche.`
      }
      breadcrumbName="Recherche"
    />
  );
}

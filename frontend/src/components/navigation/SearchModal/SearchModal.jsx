import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, ArrowRight, Tag } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { formatFCFA } from '@/utils/currency';
import productService from '@/services/productService';
import styles from './SearchModal.module.css';

export default function SearchModal() {
  const { isSearchOpen, closeSearch } = useUI();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input and load initial suggestions when opened
  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      setResults([]);
      productService.getSearchSuggestions('').then((sugs) => setSuggestions(sugs));
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [isSearchOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  // Instant debounced search when user types
  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      productService.getProducts({ search: query }).then(({ products }) => {
        setResults(products.slice(0, 5));
        setIsLoading(false);
      });
      productService.getSearchSuggestions(query).then((sugs) => setSuggestions(sugs));
    }, 180);

    return () => clearTimeout(timeoutId);
  }, [query]);

  if (!isSearchOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      closeSearch();
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSuggestionClick = (sug) => {
    setQuery(sug);
  };

  const handleResultClick = () => {
    closeSearch();
  };

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSearch();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Recherche de montres et bijoux FARÉL"
    >
      <div className={styles.modal}>
        {/* Search Header Input */}
        <form onSubmit={handleSubmit} className={styles.searchHeader}>
          <Search size={24} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Rechercher par nom, référence SKU, marque ou matière..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => setQuery('')}
              aria-label="Effacer la recherche"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeSearch}
            aria-label="Fermer la recherche"
          >
            <X size={22} />
          </button>
        </form>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* Suggestions */}
          <div className={styles.suggestionsGroup}>
            <span className={styles.groupLabel}>Suggestions Populaires :</span>
            <div className={styles.pillList}>
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.suggestionPill}
                  onClick={() => handleSuggestionClick(sug)}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Instant Live Results */}
          {query.trim().length > 0 && (
            <div className={styles.resultsList}>
              <span className={styles.groupLabel}>
                {isLoading ? 'Recherche en cours...' : `Résultats (${results.length}) :`}
              </span>

              {results.length === 0 && !isLoading ? (
                <p style={{ fontSize: '0.9rem', color: 'var(--color-muted-grey)', padding: '12px 0' }}>
                  Aucune montre ou bijou ne correspond à "{query}". Appuyez sur Entrée pour afficher tous les résultats.
                </p>
              ) : (
                results.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.slug || product.id}`}
                    className={styles.resultItem}
                    onClick={handleResultClick}
                  >
                    <img
                      src={product.primary_image || product.images?.[0]?.image}
                      alt={product.name}
                      className={styles.resultThumb}
                    />
                    <div className={styles.resultDetails}>
                      <span className={styles.resultBrand}>{product.brand}</span>
                      <h4 className={styles.resultName}>{product.name}</h4>
                      <div className={styles.resultMeta}>
                        <span>{product.category || product.category_name}</span>
                        {product.sku && (
                          <span>• Réf: {product.sku}</span>
                        )}
                      </div>
                    </div>
                    <span className={styles.resultPrice}>{formatFCFA(product.price)}</span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          {query.trim() ? (
            <Link
              to={`/search?q=${encodeURIComponent(query.trim())}`}
              className={styles.seeAllLink}
              onClick={closeSearch}
            >
              <span>Afficher tous les résultats pour "{query}"</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <span style={{ fontSize: '0.78rem', color: 'var(--color-muted-grey)' }}>
              Recherchez parmi nos collections d'horlogerie et de joaillerie d'exception
            </span>
          )}
          <span className={styles.escHint}>Échap pour fermer</span>
        </div>
      </div>
    </div>
  );
}

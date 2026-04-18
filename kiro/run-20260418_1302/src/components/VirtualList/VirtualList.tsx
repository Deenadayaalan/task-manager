// src/components/VirtualList/VirtualList.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FixedSizeList as List, VariableSizeList } from 'react-window';
import { Box, Typography } from '@mui/material';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  height: number;
  width?: number | string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  hasNextPage?: boolean;
  loadNextPage?: () => void;
}

export const VirtualList = <T,>({
  items,
  itemHeight,
  renderItem,
  height,
  width = '100%',
  overscan = 5,
  onScroll,
  loading = false,
  hasNextPage = false,
  loadNextPage
}: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback(({ scrollTop }: { scrollTop: number }) => {
    setScrollTop(scrollTop);
    onScroll?.(scrollTop);
  }, [onScroll]);

  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    
    // Load more items when approaching the end
    if (hasNextPage && loadNextPage && index >= items.length - 10) {
      loadNextPage();
    }

    if (!item) {
      return (
        <div style={style}>
          <Box p={2} textAlign="center">
            <Typography variant="body2" color="textSecondary">
              Loading...
            </Typography>
          </Box>
        </div>
      );
    }

    return <div style={style}>{renderItem(item, index, style)}</div>;
  }, [items, renderItem, hasNextPage, loadNextPage]);

  const ListComponent = useMemo(() => {
    return typeof itemHeight === 'number' ? List : VariableSizeList;
  }, [itemHeight]);

  const listProps = useMemo(() => {
    const baseProps = {
      height,
      width,
      itemCount: items.length + (hasNextPage ? 1 : 0),
      overscanCount: overscan,
      onScroll: handleScroll,
      children: Row
    };

    if (typeof itemHeight === 'number') {
      return { ...baseProps, itemSize: itemHeight };
    } else {
      return { ...baseProps, itemSize: itemHeight };
    }
  }, [height, width, items.length, hasNextPage, overscan, handleScroll, Row, itemHeight]);

  return <ListComponent {...listProps} />;
};

// Memoized list item wrapper
export const MemoizedListItem = React.memo<{
  children: React.ReactNode;
  itemId: string | number;
}>(({ children, itemId }) => {
  return <>{children}</>;
}, (prevProps, nextProps) => {
  return prevProps.itemId === nextProps.itemId;
});
import { useState, useCallback } from 'react';

interface UseTableOptions<T> {
  data: T[];
  pageSize?: number;
}

export function useTable<T>({ data, pageSize = 10 }: UseTableOptions<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return {
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    paginatedData,
  };
}

export function useSort<T>() {
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<keyof T | null>(null);

  const handleRequestSort = useCallback(
    (property: keyof T) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    },
    [order, orderBy]
  );

  const sortData = useCallback(
    (data: T[]) => {
      if (!orderBy) return data;

      return [...data].sort((a, b) => {
        const aValue = a[orderBy];
        const bValue = b[orderBy];

        if (aValue === bValue) return 0;
        
        const comparison = aValue < bValue ? -1 : 1;
        return order === 'desc' ? -comparison : comparison;
      });
    },
    [order, orderBy]
  );

  return {
    order,
    orderBy,
    handleRequestSort,
    sortData,
  };
}

export function useFilter<T>() {
  const [filter, setFilter] = useState('');

  const filterData = useCallback(
    (data: T[], searchKeys: (keyof T)[]) => {
      if (!filter) return data;

      return data.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key];
          return value && value.toString().toLowerCase().includes(filter.toLowerCase());
        })
      );
    },
    [filter]
  );

  return {
    filter,
    setFilter,
    filterData,
  };
}
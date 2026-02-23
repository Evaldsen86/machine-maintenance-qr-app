import { useState, useEffect, useCallback } from 'react';
import { Invoice } from '@/types';

const STORAGE_KEY = 'invoices';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Invoice[];
        setInvoices(parsed);
      } catch {
        setInvoices([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  }, [invoices]);

  const addInvoice = useCallback((invoice: Partial<Invoice> & Pick<Invoice, 'customerName' | 'items' | 'subtotal' | 'vat' | 'total'>) => {
    const newInvoice: Invoice = {
      customerId: invoice.customerId || 'default',
      customerName: invoice.customerName,
      date: invoice.date || new Date().toISOString(),
      dueDate: invoice.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: invoice.status || 'draft',
      items: invoice.items,
      subtotal: invoice.subtotal,
      vat: invoice.vat,
      total: invoice.total,
      notes: invoice.notes,
      offerId: invoice.offerId,
      taskId: invoice.taskId,
      machineId: invoice.machineId,
      id: invoice.id || `inv-${Date.now()}`,
      createdAt: invoice.createdAt || new Date().toISOString(),
    };
    setInvoices(prev => [newInvoice, ...prev]);
    return newInvoice;
  }, []);

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
  }, []);

  const getInvoiceById = useCallback((id: string) => {
    return invoices.find(inv => inv.id === id);
  }, [invoices]);

  const getInvoicesByOffer = useCallback((offerId: string) => {
    return invoices.filter(inv => inv.offerId === offerId);
  }, [invoices]);

  return {
    invoices,
    addInvoice,
    updateInvoice,
    getInvoiceById,
    getInvoicesByOffer,
  };
};

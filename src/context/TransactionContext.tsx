
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string;
  order_serial: string;
  created_at: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, "id" | "created_at">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionsByOrderSerial: (orderSerial: string) => Transaction[];
  loading: boolean;
  refreshTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: React.ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadTransactions = async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Loading transactions from Supabase...');
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading transactions:', error);
        throw error;
      }

      console.log('Transactions loaded:', data);
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error("حدث خطأ في تحميل المعاملات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const addTransaction = async (newTransaction: Omit<Transaction, "id" | "created_at">) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          ...newTransaction
        });

      if (error) throw error;
      
      toast.success("تم تسجيل المعاملة بنجاح");
      await loadTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error("حدث خطأ في تسجيل المعاملة");
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success("تم حذف المعاملة بنجاح");
      await loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error("حدث خطأ في حذف المعاملة");
    }
  };

  const getTransactionsByOrderSerial = (orderSerial: string) => {
    return transactions.filter(transaction => transaction.order_serial === orderSerial);
  };

  const refreshTransactions = async () => {
    await loadTransactions();
  };

  return (
    <TransactionContext.Provider value={{ 
      transactions, 
      addTransaction, 
      deleteTransaction, 
      getTransactionsByOrderSerial,
      loading,
      refreshTransactions
    }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }
  return context;
};

import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { supabase } from "@/lib/supabase";

export default function Transactions() {

  const [transactions, setTransactions] = useState([]);

  useEffect(() => {

    const fetchTransactions = async () => {

      const { data, error } = await supabase
        .from("transactions")
        .select("*");

      if (!error) {
        setTransactions(data);
      }
    };

    fetchTransactions();

  }, []);

  return (
    <ScrollView style={{ padding: 20 }}>

      {transactions.map((item: any) => (
        <View
          key={item.id}
          style={{
            marginBottom: 12,
            padding: 12,
            borderWidth: 1,
            borderRadius: 10
          }}
        >
          <Text>{item.remarks}</Text>

          <Text>
            Category: {item.category}
          </Text>

          <Text>
            Withdrawal: ₹{item.withdrawal}
          </Text>
        </View>
      ))}

    </ScrollView>
  );
}
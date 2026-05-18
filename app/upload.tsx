import { useState } from "react";
import { View, Text } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import Papa from "papaparse";

import { supabase } from "@/lib/supabase";
import { getCategory } from "@/lib/category";

export default function UploadScreen() {

  const [loading, setLoading] = useState(false);

  const pickCSV = async () => {

    const result =
      await DocumentPicker.getDocumentAsync({
        type: "text/csv",
      });

    if (result.canceled) return;

    const file = result.assets[0];

    setLoading(true);

    const response = await fetch(file.uri);
    const text = await response.text();

    Papa.parse(text, {
      header: true,

      complete: async (results: any) => {

        const transformedData =
          results.data.map((item: any) => ({

            remarks:
              item["Transaction Remarks"],

            withdrawal:
              item["Withdrawal Amount(INR)"],

            deposit:
              item["Deposit Amount(INR)"],

            category: getCategory(
              item["Transaction Remarks"]
            ),
          }));

        const { error } =
          await supabase
            .from("transactions")
            .insert(transformedData);

        if (error) {
          console.log(error);
        } else {
          alert("Uploaded Successfully!");
        }

        setLoading(false);
      },
    });
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        onPress={pickCSV}
        style={{
          fontSize: 20,
        }}
      >
        {loading
          ? "Uploading..."
          : "Upload CSV"}
      </Text>
    </View>
  );
}
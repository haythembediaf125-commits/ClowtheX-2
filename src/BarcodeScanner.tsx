import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, Vibration } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default function BarcodeScanner() {
  const [permission, setPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setPermission(status === 'granted');
    })();
  }, []);

  const handleScan = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(200);
    Alert.alert('تم المسح', data, [{ text: 'حسناً', onPress: () => setScanned(false) }]);
  };

  if (permission === null) return <View style={styles.container}><Text>جاري طلب الإذن...</Text></View>;
  if (permission === false) return <View style={styles.container}><Text>لا يوجد إذن للكاميرا</Text><Button title="إعادة المحاولة" onPress={async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setPermission(status === 'granted');
  }} /></View>;

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleScan}
        style={StyleSheet.absoluteFillObject}
        barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
      />
      <View style={styles.overlay}>
        <View style={styles.scanBox} />
        <Text style={styles.text}>وجه الكاميرا نحو رمز QR</Text>
        {scanned && <Button title="مسح مجدداً" onPress={() => setScanned(false)} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  scanBox: { width: 250, height: 250, borderWidth: 3, borderColor: '#0f0', borderRadius: 20, marginBottom: 30 },
  text: { color: 'white', fontSize: 16, backgroundColor: '#000000aa', padding: 10, borderRadius: 10 }
});

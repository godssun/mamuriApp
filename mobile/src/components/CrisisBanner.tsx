import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

const CRISIS_CONTACTS = [
  { name: '자살예방상담전화', number: '1393' },
  { name: '정신건강위기상담전화', number: '1577-0199' },
];

export default function CrisisBanner() {
  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        힘든 시간을 보내고 계시다면, 도움을 받을 수 있어요
      </Text>
      <View style={styles.contacts}>
        {CRISIS_CONTACTS.map((contact) => (
          <TouchableOpacity
            key={contact.number}
            style={styles.contactButton}
            onPress={() => handleCall(contact.number)}
          >
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactNumber}>{contact.number}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.note}>
        당신의 안전이 가장 중요합니다
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D44',
    marginBottom: 12,
    lineHeight: 20,
  },
  contacts: {
    gap: 8,
    marginBottom: 8,
  },
  contactButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  contactName: {
    fontSize: 14,
    color: '#2D2D2D',
    fontWeight: '500',
  },
  contactNumber: {
    fontSize: 15,
    color: '#D44',
    fontWeight: '700',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
});

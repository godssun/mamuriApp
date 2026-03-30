import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function CrisisBanner() {
  const { t } = useTranslation();

  const contacts = t('crisis.contacts', { returnObjects: true }) as Array<{ name: string; number: string }>;

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('crisis.title')}</Text>
      <View style={styles.contacts}>
        {Array.isArray(contacts) && contacts.map((contact) => (
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
      <Text style={styles.note}>{t('crisis.note')}</Text>
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

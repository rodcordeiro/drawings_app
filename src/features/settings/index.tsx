import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { loadUnsplashSettings, saveUnsplashSettings, type UnsplashSettings } from '@/stores/unsplashSettings';

export default function UnsplashSettingsScreen() {
  const [settings, setSettings] = React.useState<UnsplashSettings | null>(null);
  const [term, setTerm] = React.useState('');
  const [duration, setDuration] = React.useState('');
  React.useEffect(() => { let alive = true; loadUnsplashSettings().then(s => { if (alive) { setSettings(s); setDuration(String(s.timerDurationSeconds)); } }); return () => { alive = false; }; }, []);
  const update = async (next: UnsplashSettings) => {
    setSettings(next);
    try { await saveUnsplashSettings(next); } catch { Alert.alert('Erro', 'Não foi possível salvar as configurações.'); }
  };
  if (!settings) return <Text>Carregando configurações...</Text>;
  const addTerm = () => {
    const trimmed = term.trim();
    if (!trimmed || settings.searchTerms.some(t => t.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) return;
    void update({...settings, searchTerms: [...settings.searchTerms, trimmed]});
    setTerm('');
  };
  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.heading}>Configurações Unsplash</Text>
    <View style={styles.row}><Text>Ativar cronômetro</Text><Switch value={settings.timerEnabled} onValueChange={v => void update({...settings, timerEnabled: v})}/></View>
    <Text>Duração em segundos (10–7200)</Text>
    <TextInput style={styles.input} keyboardType="number-pad" value={duration} onChangeText={setDuration} onEndEditing={() => {
      const seconds = Number(duration);
      if (Number.isInteger(seconds) && seconds >= 10 && seconds <= 7200) void update({...settings, timerDurationSeconds: seconds});
      else { setDuration(String(settings.timerDurationSeconds)); Alert.alert('Duração inválida', 'Informe entre 10 e 7200 segundos.'); }
    }}/>
    <Text>Filtro de conteúdo</Text>
    <View style={styles.row}>{(['high', 'low'] as const).map(filter => <Pressable key={filter} onPress={() => void update({...settings, contentFilter: filter})}><Text style={styles.link}>{filter === settings.contentFilter ? '● ' : '○ '}{filter}</Text></Pressable>)}</View>
    <Text>Termos de pesquisa</Text>
    <View style={styles.row}><TextInput style={[styles.input, {flex: 1}]} value={term} onChangeText={setTerm} placeholder="Adicionar termo"/><Pressable onPress={addTerm}><Text style={styles.link}>Adicionar</Text></Pressable></View>
    {settings.searchTerms.map((item, index) => <View key={index} style={styles.row}>
      <TextInput style={[styles.input, {flex: 1}]} value={item} onChangeText={value => {
        const next = [...settings.searchTerms]; next[index] = value; setSettings({...settings, searchTerms: next});
      }} onEndEditing={() => {
        const cleaned = settings.searchTerms.map(t => t.trim()).filter(Boolean);
        void update({...settings, searchTerms: cleaned.filter((t, i) => cleaned.findIndex(x => x.toLowerCase() === t.toLowerCase()) === i)});
      }}/>
      <Pressable onPress={() => void update({...settings, searchTerms: settings.searchTerms.filter((_, i) => i !== index)})}><Text style={styles.link}>Remover</Text></Pressable>
    </View>)}
  </ScrollView>;
}
const styles = StyleSheet.create({container: {padding: 20, paddingTop: 85, gap: 14}, heading: {fontSize: 22, fontWeight: '600'}, row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12}, input: {borderWidth: 1, borderColor: '#aaa', borderRadius: 6, padding: 10}, link: {color: '#225cbb', padding: 8}});

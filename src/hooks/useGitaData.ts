import { useState, useEffect } from 'react';
import type { GitaData, Chapter, Verse } from '../types';

let cachedData: GitaData | null = null;

export function useGitaData() {
  const [data, setData] = useState<GitaData | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);

  useEffect(() => {
    if (cachedData) return;
    // require() is synchronous for bundled assets in React Native
    const raw = require('../../assets/data/gita_data.json') as GitaData;
    cachedData = raw;
    setData(raw);
    setLoading(false);
  }, []);

  const getChapter = (chapterNum: number): Chapter | undefined =>
    data?.chapters.find(c => c.chapter === chapterNum);

  const getVerse = (chapterNum: number, verseNum: number): Verse | undefined =>
    getChapter(chapterNum)?.verses.find(v => v.verse === verseNum);

  const getVerseByIndex = (index: number): Verse | undefined => {
    if (!data) return undefined;
    const ref = data.flat_verses[index];
    if (!ref) return undefined;
    return getVerse(ref.chapter, ref.verse);
  };

  return { data, loading, getChapter, getVerse, getVerseByIndex };
}

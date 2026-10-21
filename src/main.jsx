import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  App as AntApp, Avatar, Badge, Button, Card, Col, ConfigProvider, Divider,
  Empty, Form, Input, InputNumber, Layout, List, Modal, Popconfirm, Row, Select,
  Space, Statistic, Table, Tabs, Tag, Timeline, Tooltip, Typography, Upload, message,
  theme as antdTheme,
} from 'antd';
import {
  AppstoreOutlined, ArrowDownOutlined, BarChartOutlined, CheckCircleFilled,
  CheckOutlined, CloudOutlined, CopyOutlined, DeleteOutlined, DownloadOutlined,
  EditOutlined, HistoryOutlined, LoginOutlined, LogoutOutlined, MoonOutlined,
  PlusOutlined, SaveOutlined, SettingOutlined, SwapOutlined, SunOutlined, TeamOutlined,
  UploadOutlined, UserOutlined, WalletOutlined,
} from '@ant-design/icons';
import 'antd/dist/reset.css';
import './styles.css';
import {
  fetchCloudGroups, fetchProfile, removeCloudGroup, saveCloudGroups, saveProfile,
  supabase, supabaseConfigured,
} from './supabase';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const STATE_KEY = 'expenseSplitterStateV2';
const THEME_KEY = 'expenseSplitterThemeV1';
const CURRENCIES = [
  { value: 'INR', label: 'Indian Rupee (INR)' }, { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' }, { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'AED', label: 'UAE Dirham (AED)' }, { value: 'SGD', label: 'Singapore Dollar (SGD)' },
];
const makeId = () => globalThis.crypto && globalThis.crypto.randomUUID
  ? globalThis.crypto.randomUUID()
  : 'g-' + Date.now() + '-' + Math.random().toString(16).slice(2);
const readSaved = () => {
  try {
    const current = localStorage.getItem(STATE_KEY);
    const legacy = localStorage.getItem('expenseSplitterStateV1');
    return JSON.parse(current || legacy || '{}');
  } catch { return {}; }
};
const legacyGroup = (saved) => ({
  id: makeId(), name: saved.groupName || 'My first group',
  people: Array.isArray(saved.names) ? saved.names : [],
  expenses: Array.isArray(saved.expenses) ? saved.expenses : [],
  payments: Array.isArray(saved.payments) ? saved.payments : [],
  savedSplits: Array.isArray(saved.savedSplits) ? saved.savedSplits : [],
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
});

function AppView() {
  const saved = useMemo(readSaved, []);
  const [groups, setGroups] = useState(() => Array.isArray(saved.groups) && saved.groups.length ? saved.groups : [legacyGroup(saved)]);
  const [activeGroupId, setActiveGroupId] = useState(saved.activeGroupId || (saved.groups && saved.groups[0] && saved.groups[0].id));
  const [savedPeople, setSavedPeople] = useState(Array.isArray(saved.savedPeople) ? saved.savedPeople : (saved.names || []));
  const [preferences, setPreferences] = useState(saved.preferences || {});
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');
  const [page, setPage] = useState('dashboard');
  const [nameValue, setNameValue] = useState('');
  const [savedPersonValue, setSavedPersonValue] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [splitValues, setSplitValues] = useState({});
  const [expenseForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [authForm] = Form.useForm();
  const [groupForm] = Form.useForm();
  const [editingIndex, setEditingIndex] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authModal, setAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authPurpose, setAuthPurpose] = useState('account');
  const [pendingAuthAction, setPendingAuthAction] = useState(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [groupModal, setGroupModal] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const activeGroup = groups.find((group) => group.id === activeGroupId) || groups[0];
  const people = activeGroup ? activeGroup.people || [] : [];
  const expenses = activeGroup ? activeGroup.expenses || [] : [];
  const payments = activeGroup ? activeGroup.payments || [] : [];
  const currencyCode = preferences.currency || 'INR';
  const money = useMemo(() => new Intl.NumberFormat('en-IN', { style: 'currency', currency: currencyCode, maximumFractionDigits: 2 }), [currencyCode]);
  const formatMoney = (value) => money.format(Number(value) || 0);
  const formatInCurrency = (value, code = currencyCode) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: code, maximumFractionDigits: 2 }).format(Number(value) || 0);
  const currencySymbol = money.formatToParts(0).find((part) => part.type === 'currency')?.value || '₹';

  const patchGroup = (updater) => {
    if (!activeGroup) return;
    setGroups((current) => current.map((group) => group.id === activeGroup.id
      ? { ...group, ...(typeof updater === 'function' ? updater(group) : updater), updatedAt: new Date().toISOString() }
      : group));
  };
  const updateGroupList = (key, updater) => patchGroup((group) => ({
    [key]: typeof updater === 'function' ? updater(group[key] || []) : updater,
  }));
  const setPeople = (updater) => updateGroupList('people', updater);
  const setExpenses = (updater) => updateGroupList('expenses', updater);
  const setPayments = (updater) => updateGroupList('payments', updater);

  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify({ groups, activeGroupId: activeGroup ? activeGroup.id : null, savedPeople, preferences }));
  }, [groups, activeGroupId, activeGroup, savedPeople, preferences]);
  useEffect(() => {
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 100);
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const result = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => result.data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!supabase || !user) { setCloudReady(false); setProfile(null); return; }
    let cancelled = false;
    setCloudReady(false);
    Promise.all([fetchCloudGroups(user.id), fetchProfile(user.id)]).then(([cloudGroups, cloudProfile]) => {
      if (cancelled) return;
      setGroups((localGroups) => {
        const merged = [...cloudGroups];
        localGroups.forEach((local) => { if (!merged.some((item) => item.id === local.id)) merged.push(local); });
        return merged.length ? merged : [legacyGroup({})];
      });
      if (cloudProfile) {
        setProfile(cloudProfile);
        setSavedPeople(cloudProfile.saved_people || []);
        setPreferences((current) => ({ ...current, ...(cloudProfile.preferences || {}), currency: cloudProfile.currency_code || 'INR' }));
        profileForm.setFieldsValue({ display_name: cloudProfile.display_name || '', avatar_url: cloudProfile.avatar_url || '' });
      } else profileForm.setFieldsValue({ display_name: user.user_metadata?.display_name || '', avatar_url: '' });
      setCloudReady(true);
    }).catch((error) => {
      if (!cancelled) { messageApi.error('Could not load cloud data: ' + error.message); setCloudReady(true); }
    });
    return () => { cancelled = true; };
  }, [user?.id]);
  useEffect(() => {
    if (!supabase || !user || !cloudReady) return undefined;
    const timer = window.setTimeout(() => {
      saveCloudGroups(groups, user.id).catch((error) => messageApi.error('Cloud save failed: ' + error.message));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [groups, user?.id, cloudReady]);

  const balances = useMemo(() => {
    const result = Object.fromEntries(people.map((name) => [name, { paid: 0, share: 0, balance: 0 }]));
    expenses.forEach(({ payer, amount, splitDetails = {} }) => {
      if (!result[payer]) result[payer] = { paid: 0, share: 0, balance: 0 };
      result[payer].paid += Number(amount) || 0; result[payer].balance += Number(amount) || 0;
      Object.entries(splitDetails).forEach(([name, share]) => {
        if (!result[name]) result[name] = { paid: 0, share: 0, balance: 0 };
        result[name].share += Number(share) || 0; result[name].balance -= Number(share) || 0;
      });
    });
    payments.forEach(({ payer, payee, amount }) => {
      if (!result[payer]) result[payer] = { paid: 0, share: 0, balance: 0 };
      if (!result[payee]) result[payee] = { paid: 0, share: 0, balance: 0 };
      result[payer].paid += Number(amount) || 0; result[payer].balance += Number(amount) || 0; result[payee].balance -= Number(amount) || 0;
    });
    return result;
  }, [people, expenses, payments]);
  const settlements = useMemo(() => {
    const creditors = Object.entries(balances).filter(([, value]) => value.balance > 0.01).map(([name, value]) => ({ name, amount: value.balance })).sort((a, b) => b.amount - a.amount);
    const debtors = Object.entries(balances).filter(([, value]) => value.balance < -0.01).map(([name, value]) => ({ name, amount: -value.balance })).sort((a, b) => b.amount - a.amount);
    const result = [];
    while (creditors.length && debtors.length) {
      const amount = Math.min(creditors[0].amount, debtors[0].amount);
      result.push({ payer: debtors[0].name, payee: creditors[0].name, amount });
      creditors[0].amount -= amount; debtors[0].amount -= amount;
      if (creditors[0].amount <= 0.01) creditors.shift();
      if (debtors[0].amount <= 0.01) debtors.shift();
    }
    return result;
  }, [balances]);
  const total = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const participantOptions = people.map((person) => ({ label: person, value: person }));
  const splitTypes = [
    { label: 'Equal', value: 'equal' }, { label: 'Custom amounts', value: 'unequal' },
    { label: 'By shares', value: 'shares' }, { label: 'Percentages', value: 'percentages' },
  ];

  const addPeople = (raw = nameValue) => {
    const additions = raw.split(',').map((name) => name.trim()).filter(Boolean);
    if (!additions.length) return;
    setPeople((current) => {
      const next = [...current];
      additions.forEach((name) => { if (!next.some((item) => item.toLowerCase() === name.toLowerCase())) next.push(name); });
      return next;
    });
    setSavedPeople((current) => [...new Set([...current, ...additions])]);
    setNameValue(''); messageApi.success('People added');
  };
  const removePerson = (name) => { setPeople((current) => current.filter((person) => person !== name)); messageApi.info(name + ' removed from this group'); };
  const getSplitDetails = (amount) => {
    if (splitType === 'equal') {
      const each = Math.floor((amount / Math.max(people.length, 1)) * 100) / 100;
      const split = Object.fromEntries(people.map((person) => [person, each]));
      if (people.length) split[people[0]] = Math.round((split[people[0]] + amount - each * people.length) * 100) / 100;
      return split;
    }
    if (splitType === 'unequal') return Object.fromEntries(people.map((person) => [person, Number(splitValues[person]) || 0]));
    if (splitType === 'percentages') return Object.fromEntries(people.map((person) => [person, (amount * (Number(splitValues[person]) || 0)) / 100]));
    const totalShares = people.reduce((sum, person) => sum + (Number(splitValues[person]) || 0), 0);
    return Object.fromEntries(people.map((person) => [person, totalShares ? (amount * (Number(splitValues[person]) || 0)) / totalShares : 0]));
  };
  const resetExpense = () => { expenseForm.resetFields(); setSplitType('equal'); setSplitValues({}); setEditingIndex(null); };
  const submitExpense = (values) => {
    const amount = Number(values.amount); const splitDetails = getSplitDetails(amount);
    if (splitType === 'unequal' && Math.abs(Object.values(splitDetails).reduce((a, b) => a + b, 0) - amount) > 0.01) { messageApi.error('Split amounts must add up to the expense total'); return; }
    if (splitType === 'percentages' && Math.abs(people.reduce((sum, person) => sum + (Number(splitValues[person]) || 0), 0) - 100) > 0.01) { messageApi.error('Percentages must add up to 100%'); return; }
    if (splitType === 'shares' && people.reduce((sum, person) => sum + (Number(splitValues[person]) || 0), 0) <= 0) { messageApi.error('Enter at least one share'); return; }
    const previous = editingIndex === null ? null : expenses[editingIndex];
    const expense = { id: previous?.id || makeId(), description: values.description.trim(), payer: values.payer, amount, splitType, splitDetails, createdAt: previous?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(), category: values.category || 'Other', note: values.note || '' };
    setExpenses((current) => editingIndex === null ? [expense, ...current] : current.map((item, index) => index === editingIndex ? expense : item));
    messageApi.success(editingIndex === null ? 'Expense added' : 'Expense updated'); resetExpense();
  };
  const editExpense = (index) => {
    const expense = expenses[index]; const shares = Object.values(expense.splitDetails || {});
    const wasEqual = shares.length > 0 && shares.every((share) => Math.abs(Number(share) - Number(expense.amount) / shares.length) < 0.01);
    const type = expense.splitType || (wasEqual ? 'equal' : 'unequal');
    setEditingIndex(index); setSplitType(type);
    setSplitValues(type === 'percentages'
      ? Object.fromEntries(people.map((person) => [person, expense.amount ? ((expense.splitDetails?.[person] || 0) / expense.amount) * 100 : 0]))
      : type === 'shares' ? Object.fromEntries(people.map((person) => [person, expense.splitDetails?.[person] || 0])) : expense.splitDetails || {});
    expenseForm.setFieldsValue({ description: expense.description, payer: expense.payer, amount: expense.amount, category: expense.category || 'Other', note: expense.note || '' });
    document.getElementById('add-expense')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const recordPayment = (values) => {
    if (values.payer === values.payee) { messageApi.error('Choose two different people'); return; }
    setPayments((current) => [{ ...values, id: makeId(), amount: Number(values.amount), createdAt: new Date().toISOString() }, ...current]);
    paymentForm.resetFields(); messageApi.success('Payment recorded');
  };
  const exportCsv = () => {
    const esc = (value) => '"' + String(value ?? '').replaceAll('"', '""') + '"';
    const rows = [['Group', 'Date', 'Category', 'Description', 'Paid by', 'Total', 'Split details']];
    expenses.forEach((expense) => rows.push([activeGroup?.name, expense.createdAt || '', expense.category || '', expense.description, expense.payer, expense.amount, Object.entries(expense.splitDetails || {}).map(([name, amount]) => name + ': ' + formatMoney(amount)).join('; ')]));
    rows.push([], ['Suggested settlements'], ...settlements.map((item) => [item.payer, 'pays', item.payee, item.amount]));
    const blob = new Blob([rows.map((row) => row.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = Object.assign(document.createElement('a'), { href: url, download: 'group-settlement.csv' }); link.click(); URL.revokeObjectURL(url);
  };
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ groups, savedPeople, preferences, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = Object.assign(document.createElement('a'), { href: url, download: 'expense-splitter-backup.json' }); link.click(); URL.revokeObjectURL(url); messageApi.success('Backup downloaded');
  };
  const copySummary = async () => {
    const summary = settlements.length ? settlements.map((item) => item.payer + ' pays ' + item.payee + ' ' + formatMoney(item.amount)).join('\n') : 'Everyone is settled up.';
    try { await navigator.clipboard.writeText(summary); messageApi.success('Settlement copied'); } catch { messageApi.error('Clipboard access is unavailable'); }
  };
  const openAccountGate = (purpose, action) => {
    setAuthPurpose(purpose);
    setPendingAuthAction(action);
    setAuthMode('signup');
    setAuthModal(true);
  };
  const saveCurrentSplit = () => {
    if (!activeGroup) return;
    const snapshot = {
      id: makeId(),
      groupName: activeGroup.name,
      savedAt: new Date().toISOString(),
      people: [...people],
      expenses: JSON.parse(JSON.stringify(expenses)),
      payments: JSON.parse(JSON.stringify(payments)),
      settlements: JSON.parse(JSON.stringify(settlements)),
      total,
      currencyCode,
    };
    patchGroup((group) => ({ savedSplits: [snapshot, ...(group.savedSplits || [])] }));
    setPage('history');
    setPendingAuthAction(null);
    messageApi.success(user ? 'Split saved to your account history' : 'Split saved on this device');
  };
  const requestSaveSplit = () => {
    if (!user && supabaseConfigured) { openAccountGate('save', 'save-split'); return; }
    saveCurrentSplit();
  };
  const requestHistory = () => {
    setPage('history');
  };
  const importBackup = async (file) => {
    try {
      const backup = JSON.parse(await file.text());
      if (!Array.isArray(backup.groups) || backup.groups.some((group) => !group.id || !group.name)) {
        throw new Error('This file does not contain a valid Expense Splitter backup.');
      }
      Modal.confirm({
        title: 'Import this backup?',
        content: 'The backup groups will be added to this device. Groups with matching IDs will use the imported copy.',
        okText: 'Import backup',
        onOk: () => {
          setGroups((current) => {
            const imported = new Map(backup.groups.map((group) => [group.id, group]));
            current.forEach((group) => { if (!imported.has(group.id)) imported.set(group.id, group); });
            return [...imported.values()];
          });
          if (Array.isArray(backup.savedPeople)) setSavedPeople(backup.savedPeople);
          if (backup.preferences && typeof backup.preferences === 'object') setPreferences((current) => ({ ...current, ...backup.preferences }));
          if (backup.groups[0]?.id) setActiveGroupId(backup.groups[0].id);
          messageApi.success('Backup imported');
        },
      });
    } catch (error) { messageApi.error(error.message || 'Could not read this backup file.'); }
    return false;
  };
  const createGroup = (values) => {
    const group = { id: makeId(), name: values.name.trim(), people: [], expenses: [], payments: [], savedSplits: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setGroups((current) => [group, ...current]); setActiveGroupId(group.id); setPage('dashboard'); setGroupModal(false); groupForm.resetFields(); messageApi.success(group.name + ' created');
  };
  const switchGroup = (groupId) => { setActiveGroupId(groupId); setPage('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const deleteGroup = async (group) => {
    if (groups.length < 2) { messageApi.warning('Keep at least one group'); return; }
    try { if (user) await removeCloudGroup(group.id); } catch (error) { messageApi.error('Cloud delete failed: ' + error.message); return; }
    const remaining = groups.filter((item) => item.id !== group.id); setGroups(remaining);
    if (activeGroupId === group.id) setActiveGroupId(remaining[0].id);
    messageApi.success('Group deleted');
  };
  const submitAuth = async (values) => {
    if (!supabase) { messageApi.info('Cloud login is ready to activate when the Supabase project is connected. Data remains saved on this device.'); return; }
    setBusy(true);
    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: values.email, password: values.password, options: { data: { display_name: values.display_name } } });
        if (error) throw error;
        messageApi.success(data.session ? 'Account created' : 'Check your email to confirm your account, then sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
        if (error) throw error;
        messageApi.success('Signed in');
      }
      setAuthModal(false); authForm.resetFields();
    } catch (error) { messageApi.error(error.message); } finally { setBusy(false); }
  };
  const saveProfileChanges = async (values) => {
    const updated = { ...(profile || {}), display_name: values.display_name || '', avatar_url: values.avatar_url || '' };
    setProfile(updated);
    if (user) {
      try {
        await saveProfile(user.id, { ...updated, currency_code: currencyCode, preferences, saved_people: savedPeople, updated_at: new Date().toISOString() });
        await supabase.auth.updateUser({ data: { display_name: values.display_name || '' } }); messageApi.success('Profile saved to your account');
      } catch (error) { messageApi.error('Profile save failed: ' + error.message); }
    } else messageApi.success('Profile saved on this device. Sign in to sync it.');
  };
  const signOut = async () => { if (supabase) await supabase.auth.signOut(); setUser(null); setProfile(null); messageApi.success('Signed out'); };
  useEffect(() => {
    if (user && cloudReady) saveProfile(user.id, { display_name: profile?.display_name || user.user_metadata?.display_name || '', avatar_url: profile?.avatar_url || '', currency_code: currencyCode, preferences, saved_people: savedPeople, updated_at: new Date().toISOString() })
      .catch((error) => messageApi.error('Profile sync failed: ' + error.message));
  }, [preferences, savedPeople]);
  useEffect(() => {
    if (!user || !pendingAuthAction) return;
    if (pendingAuthAction === 'history') setPage('history');
    if (pendingAuthAction === 'save-split') saveCurrentSplit();
  }, [user?.id, pendingAuthAction]);

  const expenseColumns = [
    { title: 'Expense', dataIndex: 'description', key: 'description', render: (value, record) => <Space direction="vertical" size={2}><Text strong>{value}</Text><Text type="secondary" className="mobile-meta">{record.category || 'Other'} · Paid by {record.payer}</Text></Space> },
    { title: 'Paid by', dataIndex: 'payer', key: 'payer', responsive: ['sm'] },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: (value) => <Text strong>{formatMoney(value)}</Text> },
    { title: 'Split by person', dataIndex: 'splitDetails', key: 'splitDetails', render: (split, record) => <div className="split-list"><Tag color="blue">{record.splitType === 'unequal' ? 'Custom' : record.splitType === 'percentages' ? 'Percentages' : record.splitType === 'shares' ? 'Shares' : 'Equal'}</Tag>{Object.entries(split || {}).map(([name, value]) => <span className="split-person" key={name}><span>{name}</span><Text strong>{formatMoney(value)}</Text></span>)}</div> },
    { title: '', key: 'actions', align: 'right', render: (_, record) => <Space size={4}><Tooltip title="Edit"><Button type="text" aria-label="Edit expense" icon={<EditOutlined />} onClick={() => editExpense(record._index)} /></Tooltip><Popconfirm title="Delete this expense?" onConfirm={() => setExpenses((current) => current.filter((item) => item.id !== record.id))}><Tooltip title="Delete"><Button type="text" danger aria-label="Delete expense" icon={<DeleteOutlined />} /></Tooltip></Popconfirm></Space> },
  ];
  const balanceColumns = [
    { title: 'Person', dataIndex: 'name', key: 'name', render: (name) => <Space><Avatar size="small">{name.slice(0, 1).toUpperCase()}</Avatar><Text strong>{name}</Text></Space> },
    { title: 'Their share', dataIndex: 'share', key: 'share', align: 'right', render: formatMoney },
    { title: 'Paid', dataIndex: 'paid', key: 'paid', align: 'right', render: formatMoney },
    { title: 'Net balance', dataIndex: 'balance', key: 'balance', align: 'right', render: (value) => <Text className={value > 0.01 ? 'positive' : value < -0.01 ? 'negative' : ''} strong>{value > 0.01 ? '+' : ''}{formatMoney(value)}</Text> },
  ];
  const paymentColumns = [
    { title: 'From', dataIndex: 'payer', key: 'payer', render: (value) => <Text strong>{value}</Text> },
    { title: '', key: 'arrow', render: () => <SwapOutlined className="muted-icon" /> },
    { title: 'To', dataIndex: 'payee', key: 'payee', render: (value) => <Text strong>{value}</Text> },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: formatMoney },
    { title: '', key: 'action', align: 'right', render: (_, record) => <Popconfirm title="Remove this payment?" onConfirm={() => setPayments((current) => current.filter((item) => item.id !== record.id))}><Button type="text" danger icon={<DeleteOutlined />} aria-label="Remove payment" /></Popconfirm> },
  ];
  const activity = groups.flatMap((group) => [
    ...(group.expenses || []).map((expense) => ({ ...expense, kind: 'expense', groupName: group.name })),
    ...(group.payments || []).map((payment) => ({ ...payment, kind: 'payment', groupName: group.name })),
  ]).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const savedSnapshots = groups.flatMap((group) => (group.savedSplits || []).map((snapshot) => ({ ...snapshot, groupId: group.id })))
    .sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
  const navItems = [
    { key: 'dashboard', label: 'Overview', icon: <BarChartOutlined /> },
    { key: 'groups', label: 'Groups', icon: <AppstoreOutlined />, count: groups.length },
    { key: 'history', label: 'History', icon: <HistoryOutlined />, count: user ? savedSnapshots.length : undefined },
    { key: 'people', label: 'People', icon: <TeamOutlined />, count: savedPeople.length },
    { key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
  ];

  const renderDashboard = () => <>
    {people.length > 0 && <Row gutter={[13, 13]} className={'stats-row ' + (isScrolled ? 'is-compact' : '')}>
      <Col xs={8}><Card className="stat-card"><Statistic title="Group spend" value={total} precision={2} prefix={currencySymbol} /></Card></Col>
      <Col xs={8}><Card className="stat-card"><Statistic title="People" value={people.length} /></Card></Col>
      <Col xs={8}><Card className="stat-card"><Statistic title="To settle" value={settlements.length} /></Card></Col>
    </Row>}
    <section className="section-card people-card"><div className="section-heading"><div><Title level={4}>People in {activeGroup?.name}</Title></div><Tag>{people.length} {people.length === 1 ? 'person' : 'people'}</Tag></div><Space.Compact className="add-person"><Input value={nameValue} onChange={(event) => setNameValue(event.target.value)} onPressEnter={() => addPeople()} placeholder="Add a name or several names separated by commas" aria-label="Add participant name" /><Button type="primary" icon={<PlusOutlined />} onClick={() => addPeople()}>Add people</Button></Space.Compact><div className="people-list">{people.map((name, index) => <Tag key={name} closable onClose={(event) => { event.preventDefault(); removePerson(name); }} color={['blue', 'purple', 'cyan', 'gold', 'green'][index % 5]}>{name}</Tag>)}</div></section>
    {people.length > 0 ? <div className="feature-content">
      <section className="section-card" id="add-expense"><div className="section-heading"><div><Text className="eyebrow">GROUP WORKSPACE</Text><Title level={3}>{editingIndex === null ? 'Add an expense' : 'Edit expense'}</Title></div><div className="step-pill">01 <span>·</span> ACTIVITY</div></div>
        <Form form={expenseForm} layout="vertical" onFinish={submitExpense} className="expense-form"><Row gutter={16}>
          <Col xs={24} md={7}><Form.Item name="description" label="What was it for?" rules={[{ required: true, whitespace: true, message: 'Add a short description' }]}><Input size="large" placeholder="Dinner, groceries, taxi…" /></Form.Item></Col>
          <Col xs={12} sm={8} md={5}><Form.Item name="payer" label="Who paid?" rules={[{ required: true, message: 'Choose who paid' }]}><Select size="large" placeholder="Select a person" options={participantOptions} /></Form.Item></Col>
          <Col xs={12} sm={8} md={4}><Form.Item name="amount" label="Total amount" rules={[{ required: true, message: 'Enter the total' }]}><InputNumber size="large" min={0.01} precision={2} prefix={currencySymbol} placeholder="0.00" className="full-width" /></Form.Item></Col>
          <Col xs={12} sm={8} md={4}><Form.Item name="category" label="Category" initialValue="Other"><Select size="large" options={['Food & drink', 'Travel', 'Stay', 'Groceries', 'Transport', 'Entertainment', 'Other'].map((value) => ({ label: value, value }))} /></Form.Item></Col>
          <Col xs={12} sm={8} md={4}><Form.Item label="Split method"><Select size="large" value={splitType} onChange={(value) => { setSplitType(value); setSplitValues({}); }} options={splitTypes} /></Form.Item></Col>
        </Row><Form.Item name="note" label="Note (optional)"><Input placeholder="Add context for the group" maxLength={200} /></Form.Item>
        {splitType !== 'equal' && <div className="split-editor"><div className="split-editor-title"><Text strong>{splitType === 'unequal' ? 'Enter each person’s amount' : splitType === 'shares' ? 'Set shares for each person' : 'Set each person’s percentage'}</Text></div><Row gutter={[12, 4]}>{people.map((person) => <Col xs={12} sm={8} md={6} key={person}><Form.Item label={person}><InputNumber min={0} precision={splitType === 'percentages' ? 2 : 3} suffix={splitType === 'percentages' ? '%' : splitType === 'shares' ? 'shares' : undefined} prefix={splitType === 'unequal' ? currencySymbol : undefined} className="full-width" value={splitValues[person] ?? (splitType === 'unequal' ? undefined : 0)} onChange={(value) => setSplitValues((current) => ({ ...current, [person]: value }))} /></Form.Item></Col>)}</Row></div>}
        <div className="form-actions"><Button onClick={resetExpense}>{editingIndex === null ? 'Clear' : 'Cancel editing'}</Button><Button type="primary" htmlType="submit" icon={editingIndex === null ? <PlusOutlined /> : <CheckOutlined />}>{editingIndex === null ? 'Add expense' : 'Save changes'}</Button></div></Form>
        <Divider orientation="left" plain>Record a payment</Divider><div className="payment-entry"><Form form={paymentForm} layout="inline" onFinish={recordPayment} className="payment-form">
          <Form.Item name="payer" rules={[{ required: true, message: 'Choose who paid' }]}><Select placeholder="From" options={participantOptions} className="payment-select" /></Form.Item><SwapOutlined className="muted-icon payment-swap" />
          <Form.Item name="payee" rules={[{ required: true, message: 'Choose who received it' }]}><Select placeholder="To" options={participantOptions} className="payment-select" /></Form.Item>
          <Form.Item name="amount" rules={[{ required: true, message: 'Enter an amount' }]}><InputNumber min={0.01} precision={2} prefix={currencySymbol} placeholder="Amount" className="payment-amount" /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" ghost>Record payment</Button></Form.Item>
        </Form></div>
      </section>
      <section className="section-card activity-card"><div className="section-heading"><div><Text className="eyebrow">THE FULL PICTURE</Text><Title level={3}>Group activity</Title></div><Space wrap><Tooltip title={!expenses.length && !payments.length ? 'Add an expense or payment first' : 'Save a snapshot of this split'}><Button icon={<SaveOutlined />} disabled={!expenses.length && !payments.length} onClick={requestSaveSplit}>Save split</Button></Tooltip><Button icon={<DownloadOutlined />} onClick={exportCsv}>Export CSV</Button><Button icon={<CopyOutlined />} onClick={copySummary}>Copy settlement</Button></Space></div>
        <Tabs items={[
          { key: 'expenses', label: <span>Expenses <Tag bordered={false}>{expenses.length}</Tag></span>, children: <Table size="middle" rowKey="id" columns={expenseColumns} dataSource={expenses.map((expense, index) => ({ ...expense, _index: index }))} pagination={{ pageSize: 6, hideOnSinglePage: true }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} /> }} scroll={{ x: 660 }} /> },
          { key: 'balances', label: <span>Balances <Tag bordered={false}>{Object.keys(balances).length}</Tag></span>, children: <><Table size="middle" rowKey="name" columns={balanceColumns} dataSource={Object.entries(balances).map(([name, values]) => ({ name, ...values }))} pagination={false} />{settlements.length > 0 && <div className="settlement-box"><div className="settlement-heading"><div><Title level={5}>Settle up</Title></div><Tag color="green" icon={<CheckCircleFilled />}>{settlements.length} suggested payments</Tag></div>{settlements.map((item, index) => <div className="settlement-row" key={item.payer + item.payee + index}><Avatar size="small" className="settlement-avatar">{item.payer.slice(0, 1).toUpperCase()}</Avatar><Text strong>{item.payer}</Text><ArrowDownOutlined className="arrow-icon" /><Text strong>{item.payee}</Text><Text strong className="settlement-amount">{formatMoney(item.amount)}</Text></div>)}</div>}</> },
          { key: 'payments', label: <span>Payments <Tag bordered={false}>{payments.length}</Tag></span>, children: <Table size="middle" rowKey="id" columns={paymentColumns} dataSource={payments.map((payment, index) => ({ ...payment, _index: index }))} pagination={{ pageSize: 5, hideOnSinglePage: true }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} /> }} /> },
        ]} />
      </section>
    </div> : null}
    <footer className="page-footer"><Tag bordered={false} icon={user ? <CloudOutlined /> : <CheckCircleFilled />} color={user ? 'blue' : 'success'}>{user && cloudReady ? 'Cloud synced' : user ? 'Syncing' : 'Saved locally'}</Tag></footer>
  </>;

  const renderGroups = () => <section className="page-panel"><div className="page-toolbar"><Button type="primary" icon={<PlusOutlined />} onClick={() => setGroupModal(true)}>New group</Button></div><Row gutter={[16, 16]}>{groups.map((group, index) => {
    const groupTotal = (group.expenses || []).reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    return <Col xs={24} sm={12} xl={8} key={group.id}><Card className={'group-card ' + (group.id === activeGroupId ? 'group-card-active' : '')} hoverable onClick={() => switchGroup(group.id)}><div className="group-card-top"><Avatar className={'group-avatar avatar-tone-' + (index % 5)} icon={<TeamOutlined />} /><Tag color={group.id === activeGroupId ? 'blue' : 'default'}>{group.id === activeGroupId ? 'Current' : 'Saved'}</Tag></div><Title level={4}>{group.name}</Title><Text type="secondary">{group.people?.length || 0} people · {group.expenses?.length || 0} expenses</Text><div className="group-card-bottom"><Statistic title="Group spend" value={groupTotal} precision={2} prefix={currencySymbol} /><Popconfirm title="Delete this group and its saved activity?" description="This removes the group from your account and local device." onConfirm={(event) => { event?.stopPropagation?.(); deleteGroup(group); }} onCancel={(event) => event?.stopPropagation?.()}><Button type="text" danger icon={<DeleteOutlined />} onClick={(event) => event.stopPropagation()} aria-label={'Delete ' + group.name} /></Popconfirm></div><Button block onClick={(event) => { event.stopPropagation(); switchGroup(group.id); }}>Open group</Button></Card></Col>;
  })}</Row>{groups.length === 0 && <Empty description={false}><Button type="primary" onClick={() => setGroupModal(true)}>Create a group</Button></Empty>}</section>;

  const renderHistory = () => !user && supabaseConfigured ? <section className="page-panel account-gate"><div className="gate-icon"><HistoryOutlined /></div><Text className="eyebrow">YOUR SAVED ACTIVITY</Text><Title level={2}>Keep your history with you</Title><Button type="primary" icon={<LoginOutlined />} onClick={() => openAccountGate('history', 'history')}>Continue with an account</Button></section> : <section className="page-panel"><div className="page-toolbar"><Button icon={<DownloadOutlined />} onClick={exportBackup}>Download backup</Button></div>
    {savedSnapshots.length > 0 && <><Title level={4}>Saved splits</Title><Row gutter={[12, 12]} className="snapshot-grid">{savedSnapshots.map((snapshot) => <Col xs={24} md={12} key={snapshot.id}><Card size="small" className="snapshot-card"><Space wrap><Tag color="blue">{snapshot.groupName}</Tag><Text type="secondary">{new Date(snapshot.savedAt).toLocaleString()}</Text></Space><div className="history-description"><div><Text strong>{snapshot.expenses?.length || 0} expenses · {snapshot.people?.length || 0} people</Text><br /><Text type="secondary">{snapshot.settlements?.length || 0} suggested payments</Text></div><Text strong>{formatInCurrency(snapshot.total, snapshot.currencyCode)}</Text></div><div className="snapshot-actions"><Button type="link" onClick={() => setSelectedSnapshot(snapshot)}>View snapshot</Button><Popconfirm title="Delete this saved split?" onConfirm={() => setGroups((current) => current.map((group) => group.id === snapshot.groupId ? { ...group, savedSplits: (group.savedSplits || []).filter((item) => item.id !== snapshot.id) } : group))}><Button type="text" danger icon={<DeleteOutlined />} aria-label="Delete saved split" /></Popconfirm></div></Card></Col>)}</Row><Divider /></>}
    {activity.length ? <Timeline className="history-timeline" items={activity.map((item) => ({ color: item.kind === 'payment' ? 'green' : 'blue', children: <Card size="small" className="history-item"><Space wrap><Tag color={item.kind === 'payment' ? 'green' : 'blue'}>{item.kind === 'payment' ? 'Payment' : item.category || 'Expense'}</Tag><Tag>{item.groupName}</Tag><Text type="secondary">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Date not recorded'}</Text></Space><div className="history-description"><Text strong>{item.kind === 'payment' ? item.payer + ' paid ' + item.payee : item.description}</Text><Text strong>{formatMoney(item.amount)}</Text></div></Card> }))}
    /> : <Empty className="empty-panel" description={false} />}</section>;

  const addSavedPeople = () => {
    const additions = savedPersonValue.split(',').map((item) => item.trim()).filter(Boolean);
    if (!additions.length) return;
    setSavedPeople((current) => [...new Set([...current, ...additions])]); setSavedPersonValue(''); messageApi.success('People saved to your list');
  };
  const renderPeople = () => <section className="page-panel"><Space.Compact className="add-person library-add"><Input value={savedPersonValue} onChange={(event) => setSavedPersonValue(event.target.value)} onPressEnter={addSavedPeople} placeholder="Add one or more names" aria-label="Save people" /><Button type="primary" icon={<PlusOutlined />} onClick={addSavedPeople}>Save people</Button></Space.Compact>{savedPeople.length ? <List className="saved-people-list" dataSource={savedPeople} renderItem={(person) => <List.Item actions={[<Button key="add" type="link" onClick={() => { if (people.some((name) => name.toLowerCase() === person.toLowerCase())) { messageApi.info(person + ' is already in this group'); return; } setPeople((current) => [...current, person]); messageApi.success(person + ' added to ' + (activeGroup?.name || 'group')); }}>Add to {activeGroup?.name || 'group'}</Button>, <Popconfirm key="remove" title={'Remove ' + person + ' from saved people?'} onConfirm={() => setSavedPeople((current) => current.filter((name) => name !== person))}><Button type="text" danger icon={<DeleteOutlined />} aria-label={'Remove ' + person} /></Popconfirm>]}><List.Item.Meta avatar={<Avatar>{person.slice(0, 1).toUpperCase()}</Avatar>} title={person} /></List.Item>} /> : <Empty className="empty-panel" description={false} />}</section>;

  const renderProfile = () => <section className="page-panel profile-panel">{user ? <><div className="account-status"><Tag color="green" icon={<CheckCircleFilled />}>Signed in</Tag><Text>{user.email}</Text></div><Form form={profileForm} layout="vertical" onFinish={saveProfileChanges} className="profile-form"><Form.Item name="display_name" label="Display name"><Input placeholder="Your name" maxLength={80} /></Form.Item><Form.Item name="avatar_url" label="Profile image URL"><Input placeholder="https://…" /></Form.Item><Button type="primary" htmlType="submit">Save profile</Button></Form><Divider /><Button danger icon={<LogoutOutlined />} onClick={signOut}>Sign out</Button></> : <><div className="auth-prompt"><Avatar size={58} icon={<UserOutlined />} /><Button type="primary" icon={<LoginOutlined />} onClick={() => { setAuthPurpose('account'); setAuthMode('signup'); setAuthModal(true); }}>Sign in or create account</Button></div><Tag icon={<CloudOutlined />} color={supabaseConfigured ? 'blue' : 'orange'}>{supabaseConfigured ? 'Cloud connection ready' : 'Cloud accounts are not configured'}</Tag></>}</section>;

  const renderSettings = () => <section className="page-panel settings-panel"><Card className="setting-card"><div className="setting-copy"><Text strong>Currency</Text></div><Select value={currencyCode} options={CURRENCIES} onChange={(value) => setPreferences((current) => ({ ...current, currency: value }))} /></Card><Card className="setting-card"><div className="setting-copy"><Text strong>Appearance</Text></div><Button icon={dark ? <SunOutlined /> : <MoonOutlined />} onClick={() => setDark((value) => !value)}>{dark ? 'Switch to light' : 'Switch to dark'}</Button></Card><Card className="setting-card"><div className="setting-copy"><Text strong>Back up your data</Text></div><Space wrap><Button icon={<DownloadOutlined />} onClick={exportBackup}>Download backup</Button><Upload accept="application/json,.json" showUploadList={false} beforeUpload={importBackup}><Button icon={<UploadOutlined />}>Import backup</Button></Upload></Space></Card><Card className="setting-card"><div className="setting-copy"><Text strong>Account sync</Text></div>{user ? <Tag color="green">Cloud sync enabled</Tag> : <Button onClick={() => { setAuthPurpose('account'); setPendingAuthAction(null); setAuthMode('signup'); setAuthModal(true); }}>Sign in or create account</Button>}</Card></section>;

  const pageTitle = page === 'dashboard' ? (activeGroup?.name || 'Overview') : page === 'groups' ? 'Saved groups' : page === 'history' ? 'Activity history' : page === 'people' ? 'Saved people' : page === 'settings' ? 'Settings' : 'Profile';
  return <ConfigProvider form={{ requiredMark: (label, { required }) => <span className="required-label">{label}{required && <span className="required-mark" aria-hidden="true">*</span>}</span> }} theme={{ algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm, token: { colorPrimary: '#4667e8', colorInfo: '#4667e8', borderRadius: 12, fontFamily: 'DM Sans, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', colorBgLayout: dark ? '#111522' : '#f5f7fb', colorBgContainer: dark ? '#1a2030' : '#fff', colorText: dark ? '#edf0fb' : '#20243a', colorTextSecondary: dark ? '#a3abc0' : '#777f93', colorBorderSecondary: dark ? '#30374a' : '#e9ecf3', controlHeight: 42 } }}>
    <AntApp>{contextHolder}<Layout className="app-layout">
      <Header className="topbar"><div className="topbar-inner"><a href="#top" className="brand" onClick={(event) => { event.preventDefault(); setPage('dashboard'); }}><span className="brand-mark"><WalletOutlined /></span><span>Expense <span className="brand-accent">Splitter</span></span></a>
        <nav className="main-nav" aria-label="Main navigation">{navItems.map((item) => <Button key={item.key} type={page === item.key ? 'primary' : 'text'} icon={item.icon} onClick={() => item.key === 'history' ? requestHistory() : setPage(item.key)}>{item.label}{item.count !== undefined && <span className="nav-count">{item.count}</span>}</Button>)}</nav>
        <Space size={8}><Tooltip title={dark ? 'Switch to light appearance' : 'Switch to dark appearance'}><Button shape="circle" type="text" icon={dark ? <SunOutlined /> : <MoonOutlined />} onClick={() => setDark((value) => !value)} aria-label="Toggle appearance" /></Tooltip><Button className="account-button" type="text" onClick={() => setPage('profile')}><Badge dot={Boolean(user)} color="#43a87a"><Avatar size="small" src={profile?.avatar_url} icon={<UserOutlined />} /></Badge><span className="account-label">{profile?.display_name || 'Account'}</span></Button></Space>
      </div></Header>
      <Content className="content" id="top"><div className="page-intro"><div><Text className="eyebrow">{page === 'dashboard' ? 'SHARED SPENDING' : 'EXPENSE SPLITTER'}</Text><Title level={1}>{page === 'dashboard' ? <>Good spending starts with <span>good company.</span></> : pageTitle}</Title></div><div className="intro-icon"><TeamOutlined /></div></div>
        {page === 'dashboard' && renderDashboard()}{page === 'groups' && renderGroups()}{page === 'history' && renderHistory()}{page === 'people' && renderPeople()}{page === 'settings' && renderSettings()}{page === 'profile' && renderProfile()}
      </Content>
    </Layout>
    <Modal title={authMode === 'signup' ? 'Create your account' : 'Welcome back'} open={authModal} onCancel={() => { setAuthModal(false); setPendingAuthAction(null); }} footer={null} destroyOnHidden className="auth-modal">
      <Form form={authForm} layout="vertical" onFinish={submitAuth} preserve={false}>{authMode === 'signup' && <Form.Item name="display_name" label="Your name" rules={[{ required: true, whitespace: true }]}><Input autoComplete="name" placeholder="Alex Morgan" /></Form.Item>}<Form.Item name="email" label="Email address" rules={[{ required: true, type: 'email' }]}><Input autoComplete="email" placeholder="you@example.com" /></Form.Item><Form.Item name="password" label="Password" rules={[{ required: true, min: 8, message: 'Use at least 8 characters.' }]}><Input.Password autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} placeholder="At least 8 characters" /></Form.Item><Button type="primary" block htmlType="submit" loading={busy}>{authMode === 'signup' ? 'Create account' : 'Sign in'}</Button><div className="auth-switch"><Text type="secondary">{authMode === 'signup' ? 'Already have an account?' : 'Have an account?'}</Text><Button type="link" onClick={() => { setAuthMode(authMode === 'signup' ? 'signin' : 'signup'); authForm.resetFields(); }}>{authMode === 'signup' ? 'Sign in' : 'Create account'}</Button></div></Form>
    </Modal>
    <Modal title="Saved split details" open={Boolean(selectedSnapshot)} onCancel={() => setSelectedSnapshot(null)} footer={null} width={760} destroyOnHidden>
      {selectedSnapshot && <><Space wrap><Tag color="blue">{selectedSnapshot.groupName}</Tag><Text type="secondary">Saved {new Date(selectedSnapshot.savedAt).toLocaleString()}</Text></Space><Row gutter={12} className="snapshot-summary"><Col span={8}><Statistic title="Total expenses" value={selectedSnapshot.total || 0} precision={2} formatter={(value) => formatInCurrency(value, selectedSnapshot.currencyCode)} /></Col><Col span={8}><Statistic title="People" value={selectedSnapshot.people?.length || 0} /></Col><Col span={8}><Statistic title="Suggested payments" value={selectedSnapshot.settlements?.length || 0} /></Col></Row><Title level={5}>Expenses</Title>{selectedSnapshot.expenses?.length ? <List dataSource={selectedSnapshot.expenses} renderItem={(expense) => <List.Item><List.Item.Meta title={expense.description} description={`${expense.category || 'Other'} · Paid by ${expense.payer}`} /><Text strong>{formatInCurrency(expense.amount, selectedSnapshot.currencyCode)}</Text></List.Item>} /> : <Empty description="No expenses were in this saved split." />}<Title level={5}>Settle up</Title>{selectedSnapshot.settlements?.length ? selectedSnapshot.settlements.map((item, index) => <div className="settlement-row" key={item.payer + item.payee + index}><Text strong>{item.payer}</Text><ArrowDownOutlined className="arrow-icon" /><Text strong>{item.payee}</Text><Text strong className="settlement-amount">{formatInCurrency(item.amount, selectedSnapshot.currencyCode)}</Text></div>) : <Text type="secondary">Everyone was settled up.</Text>}</>}
    </Modal>
    <Modal title="Create a group" open={groupModal} onCancel={() => setGroupModal(false)} footer={null} destroyOnHidden><Form form={groupForm} layout="vertical" onFinish={createGroup} className="group-create-form"><Form.Item name="name" label="Group name" rules={[{ required: true, whitespace: true, message: 'Add a group name' }, { max: 80 }]}><Input autoFocus placeholder="Weekend in Goa" /></Form.Item><Button type="primary" block htmlType="submit" icon={<PlusOutlined />}>Create group</Button></Form></Modal>
  </AntApp></ConfigProvider>;
}

createRoot(document.getElementById('root')).render(<AppView />);

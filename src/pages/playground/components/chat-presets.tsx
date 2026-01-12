import { useIntl } from '@umijs/max';
import { AutoComplete, Button, message } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import '../style/chat-presets.less';

type PresetItem = {
  name: string;
  values: Record<string, any>;
};

type ChatPresetsProps = {
  parameters: Record<string, any>;
  onApply: (values: Record<string, any>) => void;
  disabled?: boolean;
};

const STORAGE_KEY = 'gpustack.chat.presets.v1';

const readPresets = (): PresetItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const writePresets = (presets: PresetItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (error) {
    // ignore storage errors
  }
};

const ChatPresets: React.FC<ChatPresetsProps> = ({
  parameters,
  onApply,
  disabled
}) => {
  const intl = useIntl();
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<PresetItem[]>([]);

  useEffect(() => {
    setPresets(readPresets());
  }, []);

  const options = useMemo(() => {
    return presets.map((item) => ({ value: item.name }));
  }, [presets]);

  const normalizeName = (value: string) => value.trim();

  const getPresetValues = () => {
    return _.omitBy(
      _.omit(parameters || {}, ['model']),
      (value) => value === undefined
    );
  };

  const handleSave = () => {
    const name = normalizeName(presetName);
    if (!name) {
      message.error(intl.formatMessage({ id: 'playground.presets.empty' }));
      return;
    }
    const values = getPresetValues();
    const existsIndex = presets.findIndex((item) => item.name === name);
    const next = [...presets];
    if (existsIndex >= 0) {
      next[existsIndex] = { name, values };
    } else {
      next.push({ name, values });
    }
    setPresets(next);
    writePresets(next);
    message.success(intl.formatMessage({ id: 'playground.presets.saved' }));
  };

  const handleLoad = () => {
    const name = normalizeName(presetName);
    if (!name) {
      message.error(intl.formatMessage({ id: 'playground.presets.empty' }));
      return;
    }
    const preset = presets.find((item) => item.name === name);
    if (!preset) {
      message.error(intl.formatMessage({ id: 'playground.presets.missing' }));
      return;
    }
    onApply(preset.values);
    message.success(intl.formatMessage({ id: 'playground.presets.loaded' }));
  };

  return (
    <div className="chat-presets">
      <div className="chat-presets-title">
        {intl.formatMessage({ id: 'playground.presets.title' })}
      </div>
      <div className="chat-presets-row">
        <AutoComplete
          value={presetName}
          options={options}
          onChange={setPresetName}
          placeholder={intl.formatMessage({
            id: 'playground.presets.placeholder'
          })}
          allowClear
          disabled={disabled}
        />
        <Button onClick={handleLoad} disabled={disabled}>
          {intl.formatMessage({ id: 'playground.presets.load' })}
        </Button>
        <Button type="primary" onClick={handleSave} disabled={disabled}>
          {intl.formatMessage({ id: 'common.button.save' })}
        </Button>
      </div>
    </div>
  );
};

export default ChatPresets;

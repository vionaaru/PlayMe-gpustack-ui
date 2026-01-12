import {
  CaretDownOutlined,
  CaretRightOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EyeOutlined,
  MenuOutlined,
  UpOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Popover, Typography, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../style/sys-message-modules.less';

type ModuleItem = {
  id: string;
  title: string;
  content: string;
  collapsed: boolean;
};

type SystemMessageModulesProps = {
  onChange: (value: string) => void;
  initialContent?: string;
};

const SystemMessageModules: React.FC<SystemMessageModulesProps> = ({
  onChange,
  initialContent = ''
}) => {
  const intl = useIntl();
  const idRef = useRef(1);
  const dragIndexRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const firstTitle = intl.formatMessage({
    id: 'playground.system.modules.title'
  });
  const newTitleBase = intl.formatMessage({
    id: 'playground.system.modules.new'
  });

  const createModule = (
    title: string,
    content = '',
    collapsed = false
  ): ModuleItem => {
    const nextId = idRef.current++;
    return {
      id: `sys-module-${nextId}`,
      title,
      content,
      collapsed
    };
  };

  const [modules, setModules] = useState<ModuleItem[]>(() => [
    createModule(firstTitle, initialContent)
  ]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const combinedMessage = useMemo(() => {
    const parts = modules
      .map((item) => item.content)
      .filter((content) => content.trim().length > 0);
    return parts.join('\n\n');
  }, [modules]);

  const summary = useMemo(() => {
    const text = combinedMessage.trim();
    const chars = text.length;
    const tokens = text ? Math.ceil(chars / 4) : 0;
    return { chars, tokens };
  }, [combinedMessage]);

  const allCollapsed = useMemo(() => {
    return modules.length > 0 && modules.every((item) => item.collapsed);
  }, [modules]);

  useEffect(() => {
    onChange(combinedMessage);
  }, [combinedMessage, onChange]);

  const getNextTitle = () => {
    const index = modules.length + 1;
    return `${newTitleBase} ${index}`;
  };

  const handleAddModule = () => {
    setModules((prev) => [...prev, createModule(getNextTitle())]);
  };

  const handleToggle = (index: number) => {
    setModules((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        collapsed: !next[index].collapsed
      };
      return next;
    });
  };

  const handleMove = (fromIndex: number, toIndex: number) => {
    setModules((prev) => {
      if (toIndex < 0 || toIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleToggleAll = () => {
    setModules((prev) =>
      prev.map((item) => ({
        ...item,
        collapsed: !allCollapsed
      }))
    );
  };

  const handleDelete = (index: number) => {
    setModules((prev) => {
      if (prev.length <= 1) return prev;
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handleTitleChange = (index: number, value: string) => {
    setModules((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        title: value.trim()
      };
      return next;
    });
  };

  const handleContentChange = (index: number, value: string) => {
    setModules((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        content: value
      };
      return next;
    });
  };

  const handleDragStart = (index: number) => (event: React.DragEvent) => {
    dragIndexRef.current = index;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', modules[index].id);
  };

  const handleDragOver = (index: number) => (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => (event: React.DragEvent) => {
    event.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === index) {
      dragIndexRef.current = null;
      setDragOverIndex(null);
      return;
    }
    setModules((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleExport = () => {
    const payload = {
      version: 1,
      modules: modules.map((item) => ({
        title: item.title,
        content: item.content,
        collapsed: item.collapsed
      }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'system-modules.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadModules = (items: Array<Partial<ModuleItem>>) => {
    idRef.current = 1;
    const next = items.map((item, index) =>
      createModule(
        (item.title || '').trim() ||
          intl.formatMessage({
            id: 'playground.system.modules.untitled'
          }),
        item.content || '',
        Boolean(item.collapsed)
      )
    );
    setModules(next.length ? next : [createModule(firstTitle, '')]);
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.modules)
          ? parsed.modules
          : null;
      if (!list) {
        message.error(
          intl.formatMessage({ id: 'playground.system.modules.import.invalid' })
        );
        return;
      }
      loadModules(list);
      message.success(
        intl.formatMessage({ id: 'playground.system.modules.import.success' })
      );
    } catch (error) {
      message.error(
        intl.formatMessage({ id: 'playground.system.modules.import.invalid' })
      );
    } finally {
      event.target.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="sys-modules">
      <div className="sys-modules-toolbar">
        <div className="sys-modules-toolbar-actions">
          <Button size="small" onClick={handleImportClick}>
            {intl.formatMessage({ id: 'common.button.import' })}
          </Button>
          <Button size="small" onClick={handleExport}>
            {intl.formatMessage({ id: 'common.button.export' })}
          </Button>
        </div>
        <div className="sys-modules-toolbar-actions">
          <Popover
            trigger="click"
            placement="bottomRight"
            content={
              <div className="sys-modules-preview-popover">
                <div className="sys-modules-preview-header">
                  <span>
                    {intl.formatMessage({
                      id: 'playground.system.modules.preview'
                    })}
                  </span>
                  <span className="sys-modules-preview-meta">
                    {intl.formatMessage({
                      id: 'playground.system.modules.chars'
                    })}{' '}
                    {summary.chars}
                    {' · '}
                    {intl.formatMessage({
                      id: 'playground.system.modules.tokens'
                    })}{' '}
                    {summary.tokens}
                  </span>
                </div>
                <Input.TextArea
                  value={combinedMessage}
                  readOnly
                  rows={8}
                  className="custome-scrollbar"
                  variant="filled"
                />
              </div>
            }
          >
            <Button size="small" icon={<EyeOutlined />}>
              {intl.formatMessage({
                id: 'playground.system.modules.preview'
              })}
            </Button>
          </Popover>
          <Button size="small" onClick={handleToggleAll}>
            {intl.formatMessage({
              id: allCollapsed
                ? 'playground.system.modules.expandAll'
                : 'playground.system.modules.collapseAll'
            })}
          </Button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />
      {modules.map((item, index) => (
        <div
          key={item.id}
          className={classNames('sys-module', {
            collapsed: item.collapsed,
            'drag-over': dragOverIndex === index
          })}
        >
          <div
            className="sys-module-header"
            onDragOver={handleDragOver(index)}
            onDrop={handleDrop(index)}
            onDragLeave={() => setDragOverIndex(null)}
          >
            <div
              className="sys-module-title"
              draggable
              onDragStart={handleDragStart(index)}
              onDragEnd={() => setDragOverIndex(null)}
            >
              <span className="drag-handle" aria-hidden="true">
                <MenuOutlined className="drag-icon" />
              </span>
              <Typography.Text
                editable={{
                  icon: <EditOutlined />,
                  onChange: (value) => handleTitleChange(index, value),
                  triggerType: ['icon']
                }}
                ellipsis
              >
                {item.title ||
                  intl.formatMessage({
                    id: 'playground.system.modules.untitled'
                  })}
              </Typography.Text>
            </div>
            <div className="sys-module-actions">
              <Button
                type="text"
                icon={<UpOutlined />}
                disabled={index === 0}
                onClick={() => handleMove(index, index - 1)}
                title={intl.formatMessage({
                  id: 'playground.system.modules.moveUp'
                })}
              />
              <Button
                type="text"
                icon={<DownOutlined />}
                disabled={index === modules.length - 1}
                onClick={() => handleMove(index, index + 1)}
                title={intl.formatMessage({
                  id: 'playground.system.modules.moveDown'
                })}
              />
              {!item.collapsed && modules.length > 1 && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(index)}
                />
              )}
              <Button
                type="text"
                icon={
                  item.collapsed ? (
                    <CaretRightOutlined />
                  ) : (
                    <CaretDownOutlined />
                  )
                }
                onClick={() => handleToggle(index)}
              />
            </div>
          </div>
          {!item.collapsed && (
            <div className="sys-module-body">
              <Input.TextArea
                className="custome-scrollbar"
                variant="filled"
                placeholder={intl.formatMessage({
                  id: 'playground.system.tips'
                })}
                value={item.content}
                rows={4}
                style={{
                  borderRadius: '0',
                  border: 'none',
                  resize: 'vertical'
                }}
                onChange={(event) =>
                  handleContentChange(index, event.target.value)
                }
              />
            </div>
          )}
        </div>
      ))}
      <div className="sys-modules-add">
        <Button type="dashed" block onClick={handleAddModule}>
          {intl.formatMessage({ id: 'common.button.add' })}
        </Button>
      </div>
    </div>
  );
};

export default SystemMessageModules;

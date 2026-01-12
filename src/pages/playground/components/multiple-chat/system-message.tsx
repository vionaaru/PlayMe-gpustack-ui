import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Divider, Input, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import '../../style/sys-message.less';

interface SystemMessageProps {
  style?: React.CSSProperties;
  systemMessage: string;
  showApplyToAll?: boolean;
  applyToAll?: (e: any) => void;
  setSystemMessage: (value: string) => void;
}

const SystemMessage: React.FC<SystemMessageProps> = (props) => {
  const { systemMessage, showApplyToAll, setSystemMessage, style, applyToAll } =
    props;
  const intl = useIntl();
  const [applyToAllModels, setApplyToAllModels] = useState(false);
  const systemMessageRef = React.useRef<any>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [textAreaHeight, setTextAreaHeight] = useState<number | undefined>(
    undefined
  );

  const syncTextAreaHeight = () => {
    const textArea = systemMessageRef.current?.resizableTextArea?.textArea;
    if (textArea?.offsetHeight) {
      setTextAreaHeight(textArea.offsetHeight);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setTimeout(() => {
      systemMessageRef.current?.focus?.({
        cursor: 'end'
      });
    }, 100);
  };

  const handleBlur = (e: any) => {
    syncTextAreaHeight();
    setIsFocused(false);
  };

  const handleOnChange = (e: any) => {
    setSystemMessage(e.target.value);
    if (applyToAllModels) {
      applyToAll?.(e.target.value);
    }
  };

  const handleClearSystemMessage = () => {
    setSystemMessage('');
  };

  const handleClickCheckbox = (e?: any) => {
    e.preventDefault();
    setApplyToAllModels(!applyToAllModels);
  };

  useEffect(() => {
    if (applyToAllModels) {
      applyToAll?.(systemMessage);
    }
  }, [applyToAllModels]);

  return (
    <div
      className={classNames('sys-message', {
        focus: isFocused
      })}
      style={{ ...style }}
    >
      {
        <div
          style={{ display: isFocused ? 'block' : 'none' }}
          className="textarea-wrapper"
        >
          <span className="system-label">
            {intl.formatMessage({ id: 'playground.systemMessage' })}
          </span>
          <Input.TextArea
            className="custome-scrollbar"
            ref={systemMessageRef}
            variant="filled"
            placeholder={intl.formatMessage({ id: 'playground.system.tips' })}
            style={{
              borderRadius: '0',
              border: 'none',
              resize: 'vertical',
              height: textAreaHeight
            }}
            value={systemMessage}
            rows={4}
            onFocus={handleFocus}
            onBlur={handleBlur}
            allowClear={false}
            onMouseUp={syncTextAreaHeight}
            onChange={handleOnChange}
          ></Input.TextArea>
          {showApplyToAll && (
            <span className="apply-check" onMouseDown={handleClickCheckbox}>
              <span className="m-r-5">
                {intl.formatMessage({
                  id: 'playground.compare.applytoall'
                })}
              </span>
              <Checkbox checked={applyToAllModels}></Checkbox>
            </span>
          )}
          <Divider style={{ margin: '0' }}></Divider>
        </div>
      }
      {!isFocused && (
        <div className="sys-content-wrap" onClick={handleFocus}>
          <div className="sys-content">
            <span className="title">
              {intl.formatMessage({ id: 'playground.systemMessage' })}
            </span>
            {systemMessage || (
              <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
                {intl.formatMessage({ id: 'playground.system.tips' })}
              </span>
            )}
          </div>
          {systemMessage && (
            <Tooltip title={intl.formatMessage({ id: 'common.button.clear' })}>
              <Button
                className="clear-btn"
                type="text"
                icon={<CloseOutlined />}
                size="small"
                onClick={handleClearSystemMessage}
              ></Button>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemMessage;

import { GPUStackVersionAtom, UpdateCheckAtom, userAtom } from '@/atoms/user';
import { setAtomStorage } from '@/atoms/utils';
import { DEFAULT_ENTER_PAGE, GPUSTACK_API_BASE_URL } from '@/config/settings';
import { requestConfig } from '@/request-config';
import {
  queryCurrentUserState,
  queryVersionInfo,
  updateCheck
} from '@/services/profile/apis';
import { isOnline } from '@/utils';
import {
  IS_FIRST_LOGIN,
  readState,
  writeState
} from '@/utils/localstore/index';
import { RequestConfig, history } from '@umijs/max';
import { message } from 'antd';

// only for the first login and access from http://localhost

const DEV_AUTH_STORAGE_KEY = 'gpustack.dev.auth';

const getDevBypassUser = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  if (typeof window === 'undefined') {
    return null;
  }
  const { hostname, search } = window.location;
  const isLocalhost =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  if (!isLocalhost) {
    return null;
  }
  const params = new URLSearchParams(search);
  const hasFlag =
    params.get('devAuth') === '1' ||
    localStorage.getItem(DEV_AUTH_STORAGE_KEY) === '1';
  if (!hasFlag) {
    return null;
  }
  if (params.get('devAuth') === '1') {
    localStorage.setItem(DEV_AUTH_STORAGE_KEY, '1');
  }
  return {
    username: 'dev',
    is_admin: false,
    full_name: 'Dev User',
    require_password_change: false,
    id: 1,
    source: 'Local',
    avatar_url: ''
  } as Global.UserInfo;
};

const checkDefaultPage = async (userInfo: any) => {
  const isFirstLogin = await readState(IS_FIRST_LOGIN);
  if (isFirstLogin === null && isOnline()) {
    writeState(IS_FIRST_LOGIN, true);
    if (userInfo && userInfo?.is_admin) {
      history.push(DEFAULT_ENTER_PAGE.adminForFirst);
    }
  }
};

// runtime configuration
export async function getInitialState(): Promise<{
  fetchUserInfo: () => Promise<Global.UserInfo>;
  currentUser?: Global.UserInfo;
}> {
  const { location } = history;
  const devUser = getDevBypassUser();

  const getUpdateCheck = async () => {
    try {
      const data = await updateCheck();

      setAtomStorage(UpdateCheckAtom, {
        ...data
      });
      return data;
    } catch (error) {
      console.error('updateCheck error', error);
    }
  };

  const fetchUserInfo = async (config?: {
    skipErrorHandler?: boolean;
  }): Promise<Global.UserInfo> => {
    try {
      const data = await queryCurrentUserState({
        skipErrorHandler: true
      });
      if (data.is_admin) {
        getUpdateCheck();
      }
      return data;
    } catch (error: any) {
      const data = error?.response?.data;
      if (data?.code === 401 && data?.message.includes('deactivate')) {
        message.error({
          content: (
            <div>
              <span>{data?.message}</span>
            </div>
          ),
          duration: 5
        });
      }
      history.push(DEFAULT_ENTER_PAGE.login);
    }
    return {} as Global.UserInfo;
  };

  const getAppVersionInfo = async () => {
    try {
      const data = await queryVersionInfo();

      const isDev = data.version?.indexOf('0.0.0') > -1;
      const isRc = data.version?.indexOf('rc') > -1;

      setAtomStorage(GPUStackVersionAtom, {
        ...data,
        isProd: !isDev && !isRc,
        isDev,
        isRc
      });
    } catch (error) {
      console.error('queryVersionInfo error', error);
    }
  };

  getAppVersionInfo();

  if (devUser) {
    setAtomStorage(userAtom, devUser);
    checkDefaultPage(devUser);
    return {
      fetchUserInfo: async () => devUser,
      currentUser: devUser
    };
  }

  if (![DEFAULT_ENTER_PAGE.login].includes(location.pathname)) {
    const userInfo = await fetchUserInfo();
    checkDefaultPage(userInfo);
    return {
      fetchUserInfo,
      currentUser: userInfo
    };
  }
  return {
    fetchUserInfo
  };
}

export const request: RequestConfig = {
  baseURL: `/${GPUSTACK_API_BASE_URL}`,
  ...requestConfig
};

import type React from 'react';
import type Sendbird from 'sendbird';

import type { UseGroupChannelMessagesOptions } from '@sendbird/chat-react-hooks';
import type { BaseHeaderProps } from '@sendbird/uikit-react-native-foundation';
import type { SendbirdMessage } from '@sendbird/uikit-utils';

import type { FileType } from '../../platform/types';
import type { CommonComponent } from '../../types';

export type GroupChannelProps = {
  Fragment: {
    onBeforeSendFileMessage?: (
      params: Sendbird.FileMessageParams,
    ) => Sendbird.FileMessageParams | Promise<Sendbird.FileMessageParams>;
    onBeforeSendUserMessage?: (
      params: Sendbird.UserMessageParams,
    ) => Sendbird.UserMessageParams | Promise<Sendbird.UserMessageParams>;
    onChannelDeleted: () => void;
    onPressHeaderLeft: GroupChannelProps['Header']['onPressHeaderLeft'];
    onPressHeaderRight: GroupChannelProps['Header']['onPressHeaderRight'];

    staleChannel: Sendbird.GroupChannel;
    enableMessageGrouping?: boolean;

    MessageRenderer?: CommonComponent<{
      message: SendbirdMessage;
      prevMessage?: SendbirdMessage;
      enableMessageGrouping?: boolean;
    }>;
    NewMessagesTooltip?: GroupChannelProps['MessageList']['NewMessagesTooltip'];
    ScrollToBottomTooltip?: GroupChannelProps['MessageList']['ScrollToBottomTooltip'];

    Header?: GroupChannelProps['Header']['Header'];

    sortComparator?: UseGroupChannelMessagesOptions['sortComparator'];
    collectionCreator?: UseGroupChannelMessagesOptions['collectionCreator'];
    queryCreator?: UseGroupChannelMessagesOptions['queryCreator'];
  };
  Header: {
    Header?: null | CommonComponent<
      BaseHeaderProps<{
        title: string | React.ReactElement;
        left: React.ReactElement;
        onPressLeft: () => void;
      }>
    >;
    onPressHeaderLeft: () => void;
    onPressHeaderRight: () => void;
  };
  MessageList: {
    channel: Sendbird.GroupChannel;
    messages: SendbirdMessage[];
    nextMessages: SendbirdMessage[];
    newMessagesFromNext: SendbirdMessage[];
    onTopReached: () => void;
    onBottomReached: () => void;

    renderMessage: (
      message: SendbirdMessage,
      prevMessage?: SendbirdMessage,
      nextMessage?: SendbirdMessage,
    ) => React.ReactElement | null;
    NewMessagesTooltip: null | CommonComponent<{
      visible: boolean;
      onPress: () => void;
      newMessages: SendbirdMessage[];
    }>;
    ScrollToBottomTooltip: null | CommonComponent<{
      visible: boolean;
      onPress: () => void;
    }>;
  };
  Input: {
    channel: Sendbird.GroupChannel;
    onSendFileMessage: (file: FileType) => void;
    onSendUserMessage: (text: string) => void;
  };
};

/**
 * Internal context for GroupChannel
 * For example, the developer can create a custom header
 * with getting data from the domain context
 * */
export type GroupChannelContextType = {
  Fragment: React.Context<{
    headerTitle: string;
    channel: Sendbird.GroupChannel;
    inputMode: 'send' | 'edit';
    setInputMode: (val: 'send' | 'edit') => void;
  }>;
  TypingIndicator: React.Context<{
    typingUsers: Sendbird.User[];
  }>;
};
export interface GroupChannelModule {
  Provider: React.FC<{ channel: Sendbird.GroupChannel }>;
  Header: CommonComponent<GroupChannelProps['Header']>;
  MessageList: CommonComponent<GroupChannelProps['MessageList']>;
  Input: CommonComponent<GroupChannelProps['Input']>;
}

export type GroupChannelFragment = React.FC<GroupChannelProps['Fragment']>;

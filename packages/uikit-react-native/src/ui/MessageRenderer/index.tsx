import React from 'react';
import { Pressable, View } from 'react-native';
import type Sendbird from 'sendbird';

import { createStyleSheet } from '@sendbird/uikit-react-native-foundation';
import type { SendbirdMessage } from '@sendbird/uikit-utils';
import { calcMessageGrouping, conditionChaining, isMyMessage, useIIFE } from '@sendbird/uikit-utils';

import AdminMessage from './AdminMessage';
import FileMessage from './FileMessage';
import MessageContainer from './MessageContainer';
import MessageDateSeparator from './MessageDateSeparator';
import MessageIncomingAvatar from './MessageIncomingAvatar';
import MessageIncomingSenderName from './MessageIncomingSenderName';
import MessageOutgoingStatus from './MessageOutgoingStatus';
import MessageTime from './MessageTime';
import UnknownMessage from './UnknownMessage';
import UserMessage from './UserMessage';

type MessageStyleVariant = 'outgoing' | 'incoming';
export interface MessageRendererInterface<T = SendbirdMessage> {
  message: T;
  prevMessage?: SendbirdMessage;
  nextMessage?: SendbirdMessage;
  variant: MessageStyleVariant;
  groupWithPrev: boolean;
  groupWithNext: boolean;
  pressed: boolean;
}

type Props = {
  channel: Sendbird.GroupChannel;
  currentUserId?: string;
  nextMessage?: SendbirdMessage;
  message: SendbirdMessage;
  prevMessage?: SendbirdMessage;
  enableMessageGrouping?: boolean;
};

const MessageRenderer: React.FC<Props> = ({ currentUserId, channel, message, ...rest }) => {
  const variant: MessageStyleVariant = isMyMessage(message, currentUserId) ? 'outgoing' : 'incoming';
  const isOutgoing = variant === 'outgoing';
  const isIncoming = variant === 'incoming';
  const variantContainerStyle = { incoming: styles.chatIncoming, outgoing: styles.chatOutgoing }[variant];

  const { groupWithPrev, groupWithNext } = calcMessageGrouping(
    Boolean(rest.enableMessageGrouping),
    message,
    rest.prevMessage,
    rest.nextMessage,
  );

  const messageComponent = useIIFE(() => {
    const props = { ...rest, variant, groupWithNext, groupWithPrev };
    if (message.isUserMessage()) {
      return (
        <Pressable style={styles.msgContainer}>
          {({ pressed }) => <UserMessage message={message} pressed={pressed} {...props} />}
        </Pressable>
      );
    }

    if (message.isFileMessage()) {
      return (
        <Pressable style={styles.msgContainer}>
          {({ pressed }) => <FileMessage message={message} pressed={pressed} {...props} />}
        </Pressable>
      );
    }

    if (message.isAdminMessage()) {
      return <AdminMessage message={message} pressed={false} {...props} />;
    }

    return (
      <Pressable style={styles.msgContainer}>
        {({ pressed }) => <UnknownMessage message={message} pressed={pressed} {...props} />}
      </Pressable>
    );
  });

  return (
    <MessageContainer>
      <MessageDateSeparator message={message} prevMessage={rest.prevMessage} />
      {message.isAdminMessage() && messageComponent}
      {!message.isAdminMessage() && (
        <View
          style={[
            variantContainerStyle,
            conditionChaining(
              [groupWithNext, Boolean(rest.nextMessage)],
              [styles.chatGroup, styles.chatNonGroup, styles.chatLastMessage],
            ),
          ]}
        >
          {isOutgoing && (
            <View style={styles.outgoingContainer}>
              <MessageOutgoingStatus channel={channel} message={message} />
              <MessageTime message={message} grouping={groupWithNext} style={styles.timeOutgoing} />
            </View>
          )}
          {isIncoming && <MessageIncomingAvatar message={message} grouping={groupWithNext} />}
          <View>
            {isIncoming && <MessageIncomingSenderName message={message} grouping={groupWithPrev} />}
            <View style={styles.bubbleContainer}>
              {messageComponent}
              {isIncoming && <MessageTime message={message} grouping={groupWithNext} style={styles.timeIncoming} />}
            </View>
          </View>
        </View>
      )}
    </MessageContainer>
  );
};

const styles = createStyleSheet({
  chatIncoming: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  chatOutgoing: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  timeIncoming: {
    marginLeft: 4,
  },
  timeOutgoing: {
    marginRight: 4,
  },
  chatGroup: {
    marginBottom: 2,
  },
  chatNonGroup: {
    marginBottom: 16,
  },
  chatLastMessage: {
    marginBottom: 16,
  },
  msgContainer: {
    maxWidth: 240,
  },
  bubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  outgoingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(MessageRenderer);

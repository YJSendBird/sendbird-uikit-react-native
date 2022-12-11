import React from 'react';

import { Text, createStyleSheet } from '@sendbird/uikit-react-native-foundation';
import type { SendbirdUser } from '@sendbird/uikit-utils';
import { createMentionTemplateRegex } from '@sendbird/uikit-utils';

import type { MentionedUser, Range } from '../types';
import type { MentionConfigInterface } from './MentionConfig';

class MentionManager {
  private _invalidStartsKeywords: string[];
  private _templateRegex: RegExp;

  constructor(public config: MentionConfigInterface, public mentionEnabled: boolean) {
    this._invalidStartsKeywords = [this.config.trigger, this.config.delimiter];
    this._templateRegex = createMentionTemplateRegex(this.config.trigger);
  }

  public rangeHelpers = {
    inRangeUnderOver(start: number, num: number, end: number) {
      return start < num && num < end;
    },
    inRangeUnderMore(start: number, num: number, end: number) {
      return start < num && num <= end;
    },
    inRangeLessOver(start: number, num: number, end: number) {
      return start <= num && num < end;
    },
    inRangeLessMore(start: number, num: number, end: number) {
      return start <= num && num <= end;
    },
    intersection(a: Range, b: Range, compare: 'underOver' | 'underMore' | 'lessOver' | 'lessMore' = 'underOver') {
      const range = {
        underOver: this.inRangeUnderOver,
        underMore: this.inRangeUnderMore,
        lessOver: this.inRangeLessOver,
        lessMore: this.inRangeLessMore,
      }[compare];

      return range(a.start, b.start, a.end) || range(a.start, b.end, a.end);
    },
  };

  public get templateRegex() {
    return this._templateRegex;
  }

  public getSearchString = (text: string, selectionIndex: number) => {
    const lastSpan = text.slice(0, selectionIndex).split(this.config.delimiter).pop() ?? '';
    const triggerIdx = lastSpan.indexOf(this.config.trigger);
    const mentionSpan = triggerIdx === -1 ? lastSpan : lastSpan.slice(triggerIdx);
    const searchString = mentionSpan.slice(this.config.trigger.length);

    return {
      searchString,
      isTriggered: () => mentionSpan.startsWith(this.config.trigger),
      isValidSearchString: () => this._invalidStartsKeywords.every((it) => !searchString.startsWith(it)),
    };
  };

  public getSearchStringRangeInText = (selectionIndex: number, searchString: string): Range => {
    return {
      start: selectionIndex - searchString.length - this.config.trigger.length,
      end: selectionIndex,
    };
  };

  /**
   * @description User to @{user.id} template format
   * */
  public asMentionedMessageTemplate = (user: SendbirdUser, delimiter = false) => {
    return `${this.config.trigger}{${user.userId}}` + (delimiter ? this.config.delimiter : '');
  };

  /**
   * @description User to @user.nickname text format
   * */
  public asMentionedMessageText = (user: SendbirdUser, delimiter = false) => {
    return `${this.config.trigger}${user.nickname}` + (delimiter ? this.config.delimiter : '');
  };

  /**
   * @description Bold @user.nickname
   * */
  public textToMentionedComponents = (text: string, mentionedUsers: MentionedUser[]) => {
    if (!this.mentionEnabled) return text;

    const { leftText, components } = mentionedUsers
      .sort((a, b) => b.range.start - a.range.start)
      .reduce(
        ({ leftText, components }, curr, currentIndex) => {
          const leftSpan = leftText.slice(0, curr.range.start);
          const mentionSpan = leftText.slice(curr.range.start, curr.range.end);
          const rightSpan = leftText.slice(curr.range.end);

          return {
            leftText: leftSpan,
            components: [
              <Text key={mentionSpan + currentIndex} style={styles.mentionedText}>
                {mentionSpan}
              </Text>,
              rightSpan,
              ...components,
            ],
          };
        },
        { leftText: text, components: [] as (string | JSX.Element)[] },
      );

    return [leftText, ...components];
  };

  public textToMentionedMessageTemplate = (text: string, mentionedUsers: MentionedUser[]) => {
    if (!this.mentionEnabled) return text;

    const { leftText, strings } = mentionedUsers
      .sort((a, b) => b.range.start - a.range.start)
      .reduce(
        ({ leftText, strings }, curr) => {
          const leftSpan = leftText.slice(0, curr.range.start);
          const templateSpan = this.asMentionedMessageTemplate(curr.user);
          const rightSpan = leftText.slice(curr.range.end);

          return {
            leftText: leftSpan,
            strings: [templateSpan, rightSpan, ...strings],
          };
        },
        { leftText: text, strings: [] as string[] },
      );

    return [leftText, ...strings].join('');
  };

  /**
   * @description Move the range by offset in the mentioned users
   * */
  public reconcileRangeInMentionedUsers = (offset: number, selectionIndex: number, mentionedUsers: MentionedUser[]) => {
    return mentionedUsers.map((it) => {
      // Changes only on the right text of selection.
      if (selectionIndex <= it.range.start) {
        return {
          ...it,
          range: { start: it.range.start + offset, end: it.range.end + offset },
        };
      }

      return it;
    });
  };

  /**
   * @description Remove users who in a range
   * */
  public removeMentionedUsersInSelection = (selection: Range, mentionedUsers: MentionedUser[]) => {
    let lastSelection = 0;
    let removedOffset = 0;
    const filtered = mentionedUsers.filter((it) => {
      const shouldRemove = this.rangeHelpers.intersection(selection, it.range, 'lessMore');
      if (shouldRemove) {
        lastSelection = Math.max(lastSelection, it.range.end);
        removedOffset -= it.range.end - it.range.start;
      }
      return !shouldRemove;
    });

    return { filtered, lastSelection, removedOffset };
  };

  /**
   * @description Convert @{user.id} template to @user.nickname text and MentionedUser[] array.
   * */
  public templateToTextAndMentionedUsers = (template: string, mentionedUsers: SendbirdUser[]) => {
    return {
      mentionedText: '',
      mentionedUsers: [] as MentionedUser[],
    };
  };
}

const styles = createStyleSheet({
  mentionedText: { fontWeight: 'bold' },
});

export default MentionManager;

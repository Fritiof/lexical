/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

//@ts-ignore-next-line
import type {RangeSelection} from 'lexical';

import {CodeNode} from '@lexical/code';
import {createHeadlessEditor} from '@lexical/headless';
import {$generateHtmlFromNodes} from '@lexical/html';
import {LinkNode} from '@lexical/link';
import {ListItemNode, ListNode} from '@lexical/list';
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
} from 'lexical';

describe('HTML', () => {
  type Input = Array<{
    name: string;
    html: string;
    initializeEditorState: () => void;
  }>;

  beforeEach(() => {
    documentSpy = jest.spyOn(globalThis, 'document', 'get');
  });

  let documentSpy: jest.SpyInstance;

  afterEach(() => {
    documentSpy.mockRestore();
  });

  const HTML_SERIALIZE: Input = [
    {
      html: '<p><br></p>',
      initializeEditorState: () => {
        $getRoot().append($createParagraphNode());
      },
      name: 'Empty editor state',
    },
  ];
  for (const {name, html, initializeEditorState} of HTML_SERIALIZE) {
    test(`[Lexical -> HTML]: ${name}`, () => {
      const editor = createHeadlessEditor({
        nodes: [
          HeadingNode,
          ListNode,
          ListItemNode,
          QuoteNode,
          CodeNode,
          LinkNode,
        ],
      });

      editor.update(initializeEditorState, {
        discrete: true,
      });

      expect(
        editor.getEditorState().read(() => $generateHtmlFromNodes(editor)),
      ).toBe(html);
    });
  }

  test(`[Lexical -> HTML]: $generateHtmlFromNodes should throw if document is not present or passed`, () => {
    const editor = createHeadlessEditor({
      nodes: [
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        CodeNode,
        LinkNode,
      ],
    });

    editor.update(
      () => {
        $getRoot().append($createParagraphNode());
      },
      {
        discrete: true,
      },
    );

    documentSpy.mockImplementation(() => undefined);
    expect(document).toBeUndefined();

    editor.getEditorState().read(() => {
      expect(() => $generateHtmlFromNodes(editor)).toThrow(
        'To use $generateHtmlFromNodes in headless mode please initialize a headless browser implementation such as JSDom and pass the document as an argument.',
      );
    });
  });

  test(`[Lexical -> HTML]: $generateHtmlFromNodes works if passed a document as an argument`, async () => {
    const editor = createHeadlessEditor({
      nodes: [
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        CodeNode,
        LinkNode,
      ],
    });

    editor.update(
      () => {
        $getRoot().append($createParagraphNode());
      },
      {
        discrete: true,
      },
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires

    const {TextEncoder, TextDecoder} = await import('util');
    Object.assign(global, {TextDecoder, TextEncoder});
    // jest.spyOn(globalThis, 'TextEncoder', 'get').mockImplementation(() => TextEncoder)

    const {JSDOM} = await import('jsdom');

    const jsdom = new JSDOM();

    documentSpy.mockImplementation(() => undefined);
    expect(document).toBeUndefined();

    expect(
      editor
        .getEditorState()
        .read(() =>
          $generateHtmlFromNodes(editor, null, jsdom.window.document),
        ),
    ).toBe('<p><br></p>');
  });

  test(`[Lexical -> HTML]: Use provided selection`, () => {
    const editor = createHeadlessEditor({
      nodes: [
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        CodeNode,
        LinkNode,
      ],
    });

    let selection: RangeSelection | null = null;

    editor.update(
      () => {
        const root = $getRoot();
        const p1 = $createParagraphNode();
        const text1 = $createTextNode('Hello');
        p1.append(text1);
        const p2 = $createParagraphNode();
        const text2 = $createTextNode('World');
        p2.append(text2);
        root.append(p1).append(p2);
        // Root
        // - ParagraphNode
        // -- TextNode "Hello"
        // - ParagraphNode
        // -- TextNode "World"
        p1.select(0, text1.getTextContentSize());
        selection = $createRangeSelection();
        selection.setTextNodeRange(text2, 0, text2, text2.getTextContentSize());
      },
      {
        discrete: true,
      },
    );

    let html = '';

    editor.update(() => {
      html = $generateHtmlFromNodes(editor, selection);
    });

    expect(html).toBe('<span style="white-space: pre-wrap;">World</span>');
  });

  test(`[Lexical -> HTML]: Default selection (undefined) should serialize entire editor state`, () => {
    const editor = createHeadlessEditor({
      nodes: [
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        CodeNode,
        LinkNode,
      ],
    });

    editor.update(
      () => {
        const root = $getRoot();
        const p1 = $createParagraphNode();
        const text1 = $createTextNode('Hello');
        p1.append(text1);
        const p2 = $createParagraphNode();
        const text2 = $createTextNode('World');
        p2.append(text2);
        root.append(p1).append(p2);
        // Root
        // - ParagraphNode
        // -- TextNode "Hello"
        // - ParagraphNode
        // -- TextNode "World"
        p1.select(0, text1.getTextContentSize());
      },
      {
        discrete: true,
      },
    );

    let html = '';

    editor.update(() => {
      html = $generateHtmlFromNodes(editor);
    });

    expect(html).toBe(
      '<p><span style="white-space: pre-wrap;">Hello</span></p><p><span style="white-space: pre-wrap;">World</span></p>',
    );
  });
});

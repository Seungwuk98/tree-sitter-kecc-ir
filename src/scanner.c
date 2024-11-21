#include "tree_sitter/alloc.h"
#include "tree_sitter/array.h"
#include "tree_sitter/parser.h"

typedef enum {
  INDENT,
  DEDENT,
  NEWLINE,
} ExternalToken;

typedef struct {
  Array(uint16_t) indents;
  bool is_dedenting;
  uint16_t dedent_indent;
} Scanner;

inline void print_scanner(Scanner *scanner) {
  printf("indents: ");
  for (unsigned i = 0; i < scanner->indents.size; ++i) {
    printf("%d ", *array_get(&scanner->indents, i));
  }
  printf("\n");
  printf("is_dedenting: %d\n", scanner->is_dedenting);
  printf("dedent_indent: %d\n", scanner->dedent_indent);
}

void tree_sitter_kecc_ir_external_scanner_deserialize(void *payload,
                                                      const char *buffer,
                                                      unsigned length) {
  Scanner *scanner = (Scanner *)payload;
  array_delete(&scanner->indents);
  array_push(&scanner->indents, 0);
  if (buffer == NULL)
    return;

  scanner->is_dedenting = *(buffer++);
  const uint16_t *indents = (const uint16_t *)buffer;

  scanner->dedent_indent = *(indents++);
  length -= sizeof(char) + sizeof(uint16_t);

  if (length) {
    size_t array_size = length / sizeof(uint16_t);
    array_reserve(&scanner->indents, array_size);

    for (unsigned i = 0; i < array_size; ++i) {
      array_push(&scanner->indents, (*(indents++)));
    }
  }
}

unsigned tree_sitter_kecc_ir_external_scanner_serialize(void *payload,
                                                        char *buffer) {
  Scanner *scanner = (Scanner *)payload;
  unsigned size = sizeof(char) + sizeof(uint16_t);

  *(buffer++) = scanner->is_dedenting;

  uint16_t *indent_buffer = (uint16_t *)buffer;
  *(indent_buffer++) = scanner->dedent_indent;

  for (unsigned i = 1; i < scanner->indents.size; ++i)
    *(indent_buffer++) = *array_get(&scanner->indents, i);
  size += (scanner->indents.size - 1) * sizeof(uint16_t);

  return size;
}

void *tree_sitter_kecc_ir_external_scanner_create(void) {
  Scanner *scanner = (Scanner *)ts_malloc(sizeof(Scanner));
  array_init(&scanner->indents);
  scanner->is_dedenting = false;
  tree_sitter_kecc_ir_external_scanner_deserialize(scanner, NULL, 0);
  return scanner;
}

void tree_sitter_kecc_ir_external_scanner_destroy(void *payload) {
  Scanner *scanner = (Scanner *)payload;
  array_delete(&scanner->indents);
  ts_free(scanner);
}

inline void skip(TSLexer *lexer) { lexer->advance(lexer, true); }
inline void advance(TSLexer *lexer) { lexer->advance(lexer, false); }

bool tree_sitter_kecc_ir_external_scanner_scan(void *payload, TSLexer *lexer,
                                               const bool *valid_symbols) {
  Scanner *scanner = (Scanner *)payload;

  bool found_end_of_line = false;
  uint16_t indent_length = 0;
  while (true) {
    if (lexer->lookahead == '\n') {
      found_end_of_line = true;
      indent_length = 0;
      skip(lexer);
    } else if (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
      indent_length++;
      skip(lexer);
    } else if (lexer->lookahead == '\r') {
      indent_length = 0;
      skip(lexer);
    } else if (lexer->eof(lexer)) {
      indent_length = 0;
      found_end_of_line = true;
      break;
    } else {
      break;
    }
  }

  assert(scanner->indents.size > 0);
  uint16_t current_indent_length = *array_back(&scanner->indents);
  if (found_end_of_line) {
    /// If found end of line, it never could be dedenting
    assert(scanner->is_dedenting == false);

    if (valid_symbols[INDENT] && indent_length > current_indent_length) {
      lexer->log(lexer, "indent_length: %d, current_indent_length: %d\n",
                 indent_length, current_indent_length);
      array_push(&scanner->indents, indent_length);
      lexer->result_symbol = INDENT;
      scanner->is_dedenting = false;
      return true;
    }

    if (valid_symbols[DEDENT] && indent_length < current_indent_length) {
      uint16_t poped = array_pop(&scanner->indents);
      lexer->log(lexer, "indent_length: %d, poped: %d, lookahead: %c\n",
                 indent_length, poped, lexer->lookahead);
      lexer->result_symbol = DEDENT;
      if (indent_length < *array_back(&scanner->indents)) {
        scanner->is_dedenting = true;
        scanner->dedent_indent = indent_length;
      }
      return true;
    }

    if (valid_symbols[NEWLINE] && indent_length == current_indent_length) {
      lexer->result_symbol = NEWLINE;
      return true;
    }
  }

  if (valid_symbols[DEDENT] && scanner->is_dedenting) {
    uint16_t poped = array_pop(&scanner->indents);
    lexer->log(lexer, "indent_length: %d, poped: %d, lookahead: %c\n",
               indent_length, poped, lexer->lookahead);
    lexer->result_symbol = DEDENT;
    if (scanner->dedent_indent >= *array_back(&scanner->indents))
      scanner->is_dedenting = false;
    return true;
  }

  scanner->is_dedenting = false;
  return false;
}

/**
 * @file kecc ir parser
 * @author SeungWuk Eun <seungwuk98@snu.ac.kr>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "kecc_ir",

  externals: $ => [
    $._indent,
    $._dedent,
    $._newline
  ],

  conflicts: $ => [
    [$._phi_nodes],
    [$._instructions],
  ],

  rules: {
    source_file: $ => seq(
      optional($._newline),
      optional(
        seq(
          $._program_statement,
          repeat(seq(
            $._newline,
            $._program_statement
          )),
        )
      ),

      optional($._newline)
    ),

    _program_statement: $ => choice(
      $.global_variable,
      $.function_definition,
      $.struct_definition,
    ),

    global_variable: $ => seq(
      'var',
      $.type,
      $.at_identifier,
      '=',
      $._initializer,
    ),

    _initializer: $ => choice(
      'default',
      $._ast_initializer,
    ),

    _ast_initializer: $ => choice(
      $._ast_expression,
      $.initializer_list,
    ),

    initializer_list: $ => seq(
      '{',
      $._ast_initializer,
      repeat(seq(',', $._ast_initializer)),
      '}'
    ),

    _ast_expression: $ => choice(
      $._ast_constant,
      seq(
        choice('+', '-'),
        '(', $._ast_constant, ')'
      ),
    ),

    _ast_constant: $ => choice(
      $.ast_integer,
      $.ast_float,
    ),

    ast_integer: $ => token(
      seq(
        choice(
          /// hexadecimal
          seq('0', choice('x', 'X'), /[0-9a-fA-F]+/),
          /// octal
          seq('0', /[0-7]+/),
          /// decimal
          /[1-9][0-9]*/,
        ),
        /// integer suffix
        optional(choice('l', 'L')),
      )
    ),

    ast_float: $ => token(
      seq(
        /[0-9]+/, '.', /[0-9]*/,
        optional(choice('f', 'F')),
      )
    ),

    struct_definition: $ => seq(
      'struct',
      $.identifier,
      ':',
      $.struct_body
    ),

    struct_body: $ => choice(
      'opaque',
      seq(
        '{',
        $.struct_member,
        repeat(seq(',', $.struct_member)),
        optional(','),
        '}'
      ),
    ),

    struct_member: $ => seq(
      choice(
        '%anon',
        $.identifier
      ),
      ':',
      $.type,
    ),

    function_definition: $ => seq(
      $.function_signature,
      optional($.function_body),
    ),

    function_body: $ => seq(
      '{',
      $._newline,
      field('init', $.init_block),
      field('blocks', repeat1($.block)),
      '}',
    ),

    function_signature: $ => seq(
      'fun',
      $.type,
      field('name', $.at_identifier),
      '(',
      optional($.function_param_types),
      ')'
    ),

    init_block: $ => seq(
      'init', ':',
      $._indent,
      $.init_block_id,
      $._newline,
      $.init_allocations,
      $._dedent,
    ),

    init_block_id: $ => seq(
      'bid', ':', field('bid', $.block_id)
    ),

    init_allocations: $ => seq(
      'allocations', ':',
      optional(
        seq(
          $._indent,
          $._allocations,
          $._dedent
        )
      ),
    ),

    _allocations: $ => seq(
      $.allocation,
      repeat(seq(
        $._newline,
        $.allocation
      )),
    ),

    allocation: $ => seq(
      token(seq('%', 'l', /[0-9]+/)),
      ':', $.type, ':', $.identifier,
    ),

    block: $ => seq(
      'block', field('bid', $.block_id), ':',
      $._indent,
      optional(seq($._phi_nodes, $._newline)),
      optional(seq($._instructions, $._newline)),
      $.exit,
      $._dedent
    ),

    _phi_nodes: $ => seq(
      $.phi_node,
      repeat(seq(
        $._newline,
        $.phi_node
      )),
    ),

    phi_node: $ => seq(
      token(seq('%', 'b', /[0-9]+/)),
      ':',
      $.phi_id,
      ':',
      $.type,
      optional(seq(':', $.identifier)),
    ),

    _instructions: $ => seq(
      $.instruction,
      repeat(seq(
        $._newline,
        $.instruction
      )),
    ),

    instruction: $ => seq(
      token(seq('%', 'b', /[0-9]+/)),
      ':', $.instruction_id, ':', $.type,
      optional(seq(':', $.identifier)), '=',
      $._instruction_inner
    ),

    _instruction_inner: $ => choice(
      $.nop,
      $.load,
      $.store,
      $.call,
      $.typecast,
      $.unary_op,
      $.arith_op,
      $.shift_op,
      $.cmp_op,
      $.bitwise_op,
      $.gep_op,
    ),

    nop: $ => 'nop',
    load: $ => seq('load', $.operand),
    store: $ => seq('store', $.operand, $.operand),
    call: $ => seq('call', $.operand, '(', optional($._call_args), ')'),
    _call_args: $ => seq(
      $.operand,
      repeat(seq(',', $.operand)),
    ),
    typecast: $ => seq('typecast', $.operand, 'to', $.type),
    unary_op: $ => seq($.unary_operator, $.operand),
    arith_op: $ => seq($.arith_operator, $.operand, $.operand),
    shift_op: $ => seq($.shift_operator, $.operand, $.operand),
    cmp_op: $ => seq('cmp', $.cmp_operator, $.operand, $.operand),
    bitwise_op: $ => seq($.bitwise_operator, $.operand, $.operand),
    gep_op: $ => seq('getelementptr', $.operand, 'offset', $.operand),

    unary_operator: $ => choice(
      'plus', 'minus', 'negate',
    ),

    arith_operator: $ => choice(
      'add', 'sub', 'mul', 'div', 'mod',
    ),

    shift_operator: $ => choice(
      'shl', 'shr',
    ),

    cmp_operator: $ => choice(
      'eq', 'ne', 'lt', 'le', 'gt', 'ge',
    ),

    bitwise_operator: $ => choice(
      'and', 'or', 'xor',
    ),

    operand: $ => choice(
      $.constant_operand,
      $.register_operand,
    ),

    constant_operand: $ => seq(
      $.constant, ':', $.type,
    ),

    register_operand: $ => seq(
      choice(
        token(seq('%', 'l', /[0-9]+/)),
        seq(token(seq('%', 'b', /[0-9]+/)), ':', choice($.instruction_id, $.phi_id))
      ),
      ':',
      $.type
    ),

    exit: $ => choice(
      $.jump,
      $.conditional_branch,
      $.switch_branch,
      $.return,
      'unreachable',
    ),

    jump: $ => seq(
      'j', $._jump_args
    ),

    _jump_args: $ => seq(
      $.block_id,
      '(',
      optional(
        seq(
          $.operand,
          repeat(seq(',', $.operand))
        ),
      ),
      ')'
    ),

    conditional_branch: $ => seq(
      'br', $.operand, ',', $._jump_args, ',', $._jump_args
    ),

    switch_branch: $ => seq(
      'switch', $.operand, 'default', $._jump_args,
      $.switch_body
    ),

    return: $ => seq(
      'ret', $.operand
    ),


    switch_body: $ => seq(
      '[',
      $._indent,
      $._switch_cases,
      $._dedent,
      ']',
    ),

    _switch_cases: $ => seq(
      $.switch_case,
      repeat(seq(
        $._newline,
        $.switch_case
      )),
    ),

    switch_case: $ => seq(
      $.operand, $._jump_args
    ),

    // Tokens
    block_id: $ => token(seq(
      'b', /[0-9]+/
    )),

    allocation_id: $ => seq(
      'l', /[0-9]+/
    ),

    instruction_id: $ => token(seq(
      'i', /[0-9]+/
    )),

    phi_id: $ => token(seq('p', /[0-9]+/)),

    percent_identifier: $ => token(seq('%', /[a-zA-Z_]/, repeat(/[a-zA-Z0-9_]/))),

    at_identifier: $ => token(seq('@', /[a-zA-Z_]/, repeat(/[a-zA-Z0-9_]/))),

    identifier: $ => choice(
      token(
        seq(
          /[a-zA-Z_]/,
          repeat(/[a-zA-Z0-9_]/),
        ),
      ),
      token(seq('%', 't', /[0-9]+/)),
    ),


    constant: $ => choice(
      seq(optional('-'), $.number),
      seq(optional('-'), $.float),
      $.at_identifier,
      'undef',
      'unit',
    ),

    type: $ => choice(
      'unit',
      $.struct_type,
      $.unsigned_integer_type,
      $.sigined_integer_type,
      $.float_type,
      $.array_type,
      $.const_type,
      $.pointer_type,
      $.function_type,
    ),

    struct_type: $ => seq(
      'struct',
      $.identifier,
    ),

    number: $ => /[0-9]+/,
    float: $ => token(seq(
      /[0-9]+/,
      '.',
      /[0-9]+/,
    )),

    unsigned_integer_type: $ => token(seq('u', /[0-9]+/)),
    sigined_integer_type: $ => token(seq('i', /[0-9]+/)),
    float_type: $ => token(seq('f', /[0-9]+/)),
    array_type: $ => seq('[', $.number, 'x', $.type, ']'),
    const_type: $ => prec.right(1, seq('const', $.type)),
    pointer_type: $ => prec.left(2, seq($.type, '*', optional('const'))),
    function_type: $ => seq('[', 'ret', ':', $.type, 'params', ':', '(',
      optional($.function_param_types),
      ')', ']'
    ),
    function_param_types: $ => seq(
      $.type,
      repeat(seq(',', $.type))
    ),
  }
});

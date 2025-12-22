import React from 'react';
import { colors } from '../../css/styles';
import BookItem from './BookItem';

const TextbookList = ({ textbooks }) => {
  return (
    <>
      <h2 style={{
        color: colors.textPrimary,
        fontSize: '22px',
        fontWeight: 'bold',
        padding: '20px 16px 12px',
        margin: 0,
      }}>
        Mandatory Textbooks
      </h2>

      {textbooks.map((book) => (
        <BookItem key={book.id} book={book} />
      ))}
    </>
  );
};

export default TextbookList;


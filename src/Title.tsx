import { FC } from 'react';

import styled from 'styled-components';

const Title: FC = () => {
  return (
    <Wrapper>
      <Body>react-recordable-handwriting-demo</Body>
      <Sub>
        <SubTitle>Author</SubTitle>
        <SubValue>
          <Link href='https://twitter.com/nerikosans'>@nerikosans</Link>
        </SubValue>
      </Sub>
      <Sub>
        <SubTitle>Repository</SubTitle>
        <SubValue>
          <Link href='https://github.com/nerikosans/react-recordable-handwriting-demo'>
            nerikosans/react-recordable-handwriting-demo
          </Link>
        </SubValue>
      </Sub>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Body = styled.h1`
  text-align: center;
`;

const Sub = styled.div`
  margin: 0.5rem auto;
`;

const SubTitle = styled.div`
  text-align: center;
  font-size: 1.1rem;
  font-weight: bold;
`;

const SubValue = styled.div``;

const Link = styled.a.attrs({
  target: '_blank',
  rel: 'noopener noreferrer',
})`
  margin-left: 0.4rem;
  line-height: 1.5rem;
`;

export default Title;

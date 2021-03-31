import { FC } from 'react';

import Handwriting from './Handwriting';
import Title from './Title';

const App: FC = () => {
  return (
    <div className='App'>
      <Title />
      <Handwriting />
    </div>
  );
};

export default App;

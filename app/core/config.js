import * as dotenv from 'dotenv';

class Config {
  constructor() {
    const { parsed, error } = dotenv.config();

    if(error) throw new Error();
    if(!parsed) throw new Error();

    this.config = parsed;
  }

  get(key) {
    const value = this.config[key];
    if(!value) throw new Error(`${key} не найден`);
    return value;
  }
}


export default Config;

// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import App from './App.vue';

describe('App', () => {
  it('renders the study group name', () => {
    const wrapper = mount(App);

    expect(wrapper.get('h1').text()).toBe('Matayoshi Kobudo Study Group');
  });
});

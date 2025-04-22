'use client';

import { useTranslations } from 'next-intl';
import { useLogin } from '../hooks/useLogin';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Form, FormField, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

export function LoginForm() {
  const t = useTranslations('LoginPage');
  const { credentials, isLoading, error, handleChange, handleSubmit } = useLogin();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form onSubmit={handleSubmit}>
          {error && <FormMessage>{error}</FormMessage>}
          
          <FormField>
            <FormLabel htmlFor="username">{t('usernameLabel')}</FormLabel>
            <Input
              id="username"
              name="username"
              type="text"
              value={credentials.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </FormField>
          
          <FormField>
            <FormLabel htmlFor="password">{t('passwordLabel')}</FormLabel>
            <Input
              id="password"
              name="password"
              type="password"
              value={credentials.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </FormField>
          
          <Button 
            type="submit" 
            className="w-full mt-4" 
            disabled={isLoading}
          >
            {isLoading ? t('loggingIn') : t('login')}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
} 
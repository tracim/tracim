import React from 'react'
import { translate } from 'react-i18next'
import {
  PageContent,
  PageTitle,
  PageWrapper
} from 'tracim_frontend_lib'

require('./AdvancedSearchLoader.styl')

const itemList = [...Array(10).keys()]
const itemHeight = 65

export const AdvancedSearchLoader = props =>
  <div className='tracim__content fullWidthFullHeight'>
    <div className='tracim__content-scrollview'>
      <PageWrapper customClass='advancedSearchLoader'>
        <PageTitle
          title={props.t('Search results')}
          icon='fas fa-search'
          breadcrumbsList={[]}
        />
        <PageContent>
          <div className='advancedSearchLoader'>
            <div className='advancedSearchLoader__loading'>
              <i className='fas fa-spinner fa-spin' />
              {props.t('Loading')}
            </div>

            <svg className='advancedSearchLoader__svg' viewBox='0 0 1298 796' preserveAspectRatio='none'>
              <rect x='15' className='advancedSearchLoader__svg__rectangle__text advancedSearchLoader__options' />
              <rect x='130' className='advancedSearchLoader__svg__rectangle__text advancedSearchLoader__options' />
              <rect x='245' className='advancedSearchLoader__svg__rectangle__text advancedSearchLoader__options' />
              <rect className='advancedSearchLoader__svg__rectangle__input' />

              <rect className='advancedSearchLoader__svg__rectangle__button' />

              <rect x='25' y='90' width='50' className='advancedSearchLoader__svg__rectangle__text' />
              <rect x='110' y='90' width='110' className='advancedSearchLoader__svg__rectangle__text' />
              <rect
                y='90'
                width='170'
                className='advancedSearchLoader__svg__rectangle__text advancedSearchLoader__thirdColumn'
              />
              <rect x='1015' y='90' width='100' className='advancedSearchLoader__svg__rectangle__text' />
              {itemList.map(index =>
                <>
                  <rect y={125 + index * itemHeight} className='advancedSearchLoader__svg__rectangle__list' />

                  <rect y={140 + index * itemHeight} className='advancedSearchLoader__svg__rectangle__icon' />

                  <rect
                    x='110'
                    y={135 + index * itemHeight}
                    width='170'
                    className='advancedSearchLoader__svg__rectangle__text'
                  />
                  <rect
                    x='110'
                    y={160 + index * itemHeight}
                    width='300'
                    className='advancedSearchLoader__svg__rectangle__text'
                  />

                  <rect
                    y={135 + index * itemHeight}
                    width='170'
                    className='advancedSearchLoader__svg__rectangle__text advancedSearchLoader__thirdColumn'
                  />
                  <rect
                    y={160 + index * itemHeight}
                    width='190'
                    className='advancedSearchLoader__svg__rectangle__text advancedSearchLoader__thirdColumn'
                  />

                  <rect
                    x='1015'
                    y={150 + index * itemHeight}
                    width='170'
                    className='advancedSearchLoader__svg__rectangle__text'
                  />
                </>
              )}
            </svg>
          </div>
        </PageContent>
      </PageWrapper>
    </div>
  </div>
export default translate()(AdvancedSearchLoader)
